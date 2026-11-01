import { chatResponse } from './chat.js';
import { PROMPT_VERSION } from './prompt.js';

const buckets = new Map(), failures = new Map();
let active = 0;
const encode = new TextEncoder();
async function validToken(provided, expected) {
  const hashes = await Promise.all([provided, expected].map(value => crypto.subtle.digest('SHA-256', encode.encode(value))));
  const [a, b] = hashes.map(value => new Uint8Array(value));
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
export async function apiResponse(request, env, fetchImpl = fetch) {
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('origin');
  const ownOrigin = new URL(request.url).origin;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const localOrigin = env.LOCAL_ONLY === 'true' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  if (origin && origin !== ownOrigin && !allowed.includes(origin) && !localOrigin) return Response.json({ error: '此网站来源未获后台允许。' }, { status: 403 });
  const cors = { Vary: 'Origin', 'X-Content-Type-Options': 'nosniff', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) };
  const finish = response => { for (const [key, value] of Object.entries(cors)) response.headers.set(key, value); response.headers.set('Cache-Control', 'no-store'); return response; };
  if (request.method === 'OPTIONS') return finish(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '600' } }));
  if (path === '/api/health' && request.method === 'GET') return finish(Response.json({ service: 'xueyouju', configured: Boolean(env.DEEPSEEK_API_KEY && env.APP_ACCESS_TOKEN), authRequired: true, promptVersion: PROMPT_VERSION, models: ['deepseek-flash', 'deepseek-v4-pro'] }));
  if (!['/api/access', '/api/chat'].includes(path) || request.method !== 'POST') return finish(Response.json({ error: '接口不存在。' }, { status: 404 }));
  // Every model request requires the app key, including local and private deployments.
  if (!env.APP_ACCESS_TOKEN) return finish(Response.json({ error: '后台尚未配置 AI 访问密钥。' }, { status: 503 }));
  const identity = env.CLIENT_IP || request.headers.get('cf-connecting-ip') || 'shared';
  const now = Date.now();
  for (const [key, value] of failures) if (now - value.started >= 600000) failures.delete(key);
  const attempts = failures.get(identity) || { started: now, count: 0 };
  if (attempts.count >= 10) return finish(Response.json({ error: '密钥尝试次数过多，请十分钟后再试。' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((attempts.started + 600000 - now) / 1000)) } }));
  const authorization = request.headers.get('authorization') || '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!provided || provided.length > 512 || !(await validToken(provided, env.APP_ACCESS_TOKEN))) {
    attempts.count++;
    if (failures.size >= 10000 && !failures.has(identity)) failures.delete(failures.keys().next().value);
    failures.set(identity, attempts);
    return finish(Response.json({ error: '访问密钥不正确，请重新输入。' }, { status: 401 }));
  }
  failures.delete(identity);
  if (path === '/api/access') return finish(Response.json({ unlocked: true, configured: Boolean(env.DEEPSEEK_API_KEY) }));
  if (!request.headers.get('content-type')?.startsWith('application/json')) return finish(Response.json({ error: '需要 application/json 请求。' }, { status: 415 }));
  for (const [key, value] of buckets) if (now - value.started > 60000) buckets.delete(key);
  const bucket = buckets.get(identity) || { started: now, count: 0 };
  if (bucket.count >= 15 || active >= 3) return finish(Response.json({ error: '请求较多，请等待当前回答完成后再试。' }, { status: 429 }));
  bucket.count++; buckets.set(identity, bucket); active++;
  try {
    const response = await chatResponse(request, env, fetchImpl);
    if (!response.body) { active--; return finish(response); }
    const reader = response.body.getReader(); let released = false;
    const release = () => { if (!released) { active--; released = true; } };
    return finish(new Response(new ReadableStream({
      async pull(controller) { try { const item = await reader.read(); if (item.done) { release(); controller.close(); } else controller.enqueue(item.value); } catch (error) { release(); controller.error(error); } },
      async cancel() { release(); await reader.cancel(); },
    }), { status: response.status, headers: response.headers }));
  } catch { active--; return finish(Response.json({ error: '后台处理失败，请稍后重试。' }, { status: 500 })); }
}
