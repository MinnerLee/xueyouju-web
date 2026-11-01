import test from 'node:test';
import assert from 'node:assert/strict';
import { apiResponse } from '../server/api.js';
import { serviceResponse } from '../server/service.js';
import { defaultBackendOrigin, HOSTED_API_ORIGIN, PUBLIC_SITE_URL } from '../src/hosting.js';

const env = { APP_ACCESS_TOKEN: 'test-only-access-key', DEEPSEEK_API_KEY: 'test-only-provider-key', ALLOWED_ORIGINS: 'https://minnerlee.github.io' };
const req = (path, key, identity = crypto.randomUUID()) => new Request('https://service.example'+path, { method: 'POST', headers: { Origin: 'https://minnerlee.github.io', 'Content-Type': 'application/json', 'cf-connecting-ip': identity, ...(key ? { Authorization: 'Bearer '+key } : {}) }, body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }], courseId: 'general', mode: 'guide' }) });

test('access validation accepts only the app key and never invokes the model', async()=>{
  const noModel = ()=> { throw new Error('Access validation must not call the provider'); };
  for (const key of [undefined, 'wrong', env.DEEPSEEK_API_KEY]) {
    const response = await apiResponse(req('/api/access',key),env,noModel);
    assert.equal(response.status,401);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://minnerlee.github.io');
  }
  const good=await apiResponse(req('/api/access',env.APP_ACCESS_TOKEN),env,noModel);
  assert.equal(good.status,200);
  assert.deepEqual(await good.json(),{ unlocked: true, configured: true });
  assert.equal(good.headers.get('cache-control'),'no-store');
});

test('direct chat calls cannot bypass authentication through localhost or platform flags', async()=>{
  let calls=0;
  const provider=async()=>{calls++;return new Response('');};
  for (const extra of [{}, { LOCAL_ONLY: 'true' }, { SITE_PRIVATE_MODE: 'true' }]) {
    assert.equal((await apiResponse(req('/api/chat','wrong'),{...env,...extra},provider)).status,401);
    assert.equal((await apiResponse(req('/api/chat','anything'),{...env,...extra,APP_ACCESS_TOKEN:''},provider)).status,503);
  }
  assert.equal(calls,0);
});

test('authorized chat reaches the provider without forwarding the app key', async()=>{
  let auth;
  const response=await apiResponse(req('/api/chat',env.APP_ACCESS_TOKEN),env,async(_url,init)=>{
    auth=init.headers.Authorization;
    return new Response('data: {"choices":[{"delta":{"content":"你好"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  });
  const text=await response.text();
  assert.equal(response.status,200);
  assert.equal(auth,'Bearer '+env.DEEPSEEK_API_KEY);
  assert.match(text,/event: done/);
  assert.ok(!text.includes(env.APP_ACCESS_TOKEN)&&!text.includes(env.DEEPSEEK_API_KEY));
});

test('failed password attempts are throttled for both access and direct chat',async()=>{
  const identity='test-throttle';
  for(let i=0;i<10;i++) assert.equal((await apiResponse(req(i%2?'/api/chat':'/api/access','wrong',identity),env)).status,401);
  const denied=await apiResponse(req('/api/access',env.APP_ACCESS_TOKEN,identity),env);
  assert.equal(denied.status,429);
  assert.ok(Number(denied.headers.get('Retry-After'))>0);
  assert.equal((await apiResponse(req('/api/access',env.APP_ACCESS_TOKEN,'another-test-client'),env)).status,200);
});

test('official cross-origin preflight is allowed, unapproved origins are rejected',async()=>{
  const preflight=new Request('https://service.example/api/access',{method:'OPTIONS',headers:{Origin:'https://minnerlee.github.io','Access-Control-Request-Headers':'authorization'}});
  const allowed=await apiResponse(preflight,env);
  assert.equal(allowed.status,204);
  assert.match(allowed.headers.get('Access-Control-Allow-Headers'),/Authorization/);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),'https://minnerlee.github.io');
  const hostile=new Request('https://service.example/api/chat',{method:'OPTIONS',headers:{Origin:'https://attacker.example'}});
  assert.equal((await apiResponse(hostile,env)).status,403);
});

test('all legacy hosted pages redirect to the main site and API stays guarded',async()=>{
  for(const path of ['/','/workspace/','/workspace/index.html','/workspace/src/chat.js']) {
    const response=await serviceResponse(new Request('https://service.example'+path),env);
    assert.equal(response.status,302);assert.equal(response.headers.get('Location'),PUBLIC_SITE_URL);
    assert.equal(await response.text(),'');
  }
  assert.equal((await serviceResponse(req('/api/chat'),env)).status,401);
});

test('official Pages connects to the hosted API while forks and local previews use their own server',()=>{
  assert.equal(defaultBackendOrigin(new URL(PUBLIC_SITE_URL)),HOSTED_API_ORIGIN);
  for (const url of ['http://127.0.0.1:4173/#chat','https://fork.github.io/xueyouju-web/','https://minnerlee.github.io/other-project/']) assert.equal(defaultBackendOrigin(new URL(url)),new URL(url).origin);
});
