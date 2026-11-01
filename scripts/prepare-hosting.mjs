// Prepare a separate Sites Vinext checkout. Contains only public source, never secrets.
import { cp, mkdir, readFile, writeFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';
import { PUBLIC_SITE_URL } from '../src/hosting.js';

const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Supply an absolute initialized Sites checkout path.');
const manifest = JSON.parse(await readFile(path.join(destination, '.openai/hosting.json'), 'utf8'));
if (!manifest.project_id) throw new Error('The target must be a registered Sites checkout.');
// Remove only the generated legacy UI, after verifying its resolved location.
const checkout = await realpath(destination);
const legacy = path.join(checkout, 'public', 'workspace');
try {
  if (await realpath(legacy) !== legacy) throw new Error('Refusing to remove a redirected workspace path.');
  if (!legacy.startsWith(checkout + path.sep)) throw new Error('Legacy path must remain inside the hosting checkout.');
  await rm(legacy, { recursive: true });
} catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const dir of ['server','shared']) await cp(path.join(root,dir),path.join(destination,'assistant',dir),{recursive:true});
await mkdir(path.join(destination,'assistant/src'),{recursive:true});
for (const file of ['courses.js','hosting.js']) await cp(path.join(root,'src',file),path.join(destination,'assistant/src',file));
await writeFile(path.join(destination,'worker/index.ts'), `import { serviceResponse } from "../assistant/server/service.js";\nexport default { fetch(request: Request, env: Cloudflare.Env) { return serviceResponse(request, env); } };\n`);
await writeFile(path.join(destination,'app/page.tsx'), `import { redirect } from "next/navigation";\nexport default function Home() { redirect(${JSON.stringify(PUBLIC_SITE_URL)}); }\n`);
await writeFile(path.join(destination,'app/layout.tsx'), `import type { Metadata } from 'next';\nexport const metadata: Metadata = { title: '学有据 · AI 后台', description: '主站学习助手的受保护 API。' };\nexport default function Layout({children}:{children:React.ReactNode}) { return <html lang="zh-CN"><body>{children}</body></html>; }\n`);
await writeFile(path.join(destination,'README.md'),'# 学有据 AI 后台\n\n由 xueyouju-web/scripts/prepare-hosting.mjs 生成，权威源码：MinnerLee/xueyouju-web。仅提供 /api/*，其他路径跳回主站，不再托管独立工作台。\n\nAPP_ACCESS_TOKEN 与 DEEPSEEK_API_KEY 均为平台秘密变量。每次模型请求都校验应用密钥；ALLOWED_ORIGINS 只允许主站来源。先部署并验证密钥校验，再允许平台公开访问。\n');
console.log('Hosting source prepared. Runtime secrets remain on the hosting platform.');
