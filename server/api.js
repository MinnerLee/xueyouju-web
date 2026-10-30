import { chatResponse } from './chat.js';
import { PROMPT_VERSION } from './prompt.js';

const buckets = new Map();
let active = 0;
export async function apiResponse(request, env, fetchImpl = fetch) {
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('origin');
  const ownOrigin = new URL(request.url).origin;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const localOrigin = env.LOCAL_ONLY === 'true' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  if (origin && origin !== ownOrigin && !allowed.includes(origin) && !localOrigin) return Response.json({ error: '此网站来源未获后台允许。' }, { status: 403 });
  const cors = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  const finish = response => { for (const [key, value] of Object.entries(cors)) response.headers.set(key, value); response.headers.set('Cache-Control', 'no-store'); return response; };
  if (request.method === 'OPTIONS') return finish(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '600' } }));
  if (path === '/api/health' && request.method === 'GET') return finish(Response.json({ service: 'xueyouju', configured: Boolean(env.DEEPSEEK_API_KEY), authRequired: Boolean(env.APP_ACCESS_TOKEN), promptVersion: PROMPT_VERSION, models: ['deepseek-flash', 'deepseek-v4-pro'] }));
  if (path !== '/api/chat' || request.method !== 'POST') return finish(Response.json({ error: '接口不存在。' }, { status: 404 }));
  if (env.APP_ACCESS_TOKEN) {
    const provided = request.headers.get('authorization') || '';
    if (provided !== `Bearer ${env.APP_ACCESS_TOKEN}`) return finish(Response.json({ error: '后台访问口令不正确，请检查连接设置。' }, { status: 401 }));
  } else if (env.SITE_PRIVATE_MODE !== 'true' && env.LOCAL_ONLY !== 'true') return finish(Response.json({ error: '公开部署必须先配置访问口令。' }, { status: 503 }));
  if (!request.headers.get('content-type')?.startsWith('application/json')) return finish(Response.json({ error: '需要 application/json 请求。' }, { status: 415 }));
  const identity = request.headers.get('oai-authenticated-user-id') || request.headers.get('cf-connecting-ip') || 'shared';
  const now = Date.now();
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
