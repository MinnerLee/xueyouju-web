// Prepare a separate Sites Vinext checkout. Contains only public source, never secrets.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build, root } from './build.mjs';

const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Supply an absolute initialized Sites checkout path.');
const manifest = JSON.parse(await readFile(path.join(destination, '.openai/hosting.json'), 'utf8'));
if (!manifest.project_id) throw new Error('The target must be a registered Sites checkout.');
await build();
await mkdir(path.join(destination, 'public/workspace'), { recursive: true });
await cp(path.join(root, 'dist'), path.join(destination, 'public/workspace'), { recursive: true });
for (const dir of ['server','shared']) await cp(path.join(root,dir),path.join(destination,'assistant',dir),{recursive:true});
await mkdir(path.join(destination,'assistant/src'),{recursive:true});
await cp(path.join(root,'src/courses.js'),path.join(destination,'assistant/src/courses.js'));
await writeFile(path.join(destination,'worker/index.ts'), `import handler from "vinext/server/fetch-handler";\nimport { apiResponse } from "../assistant/server/api.js";\nexport default {\n  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {\n    if (new URL(request.url).pathname.startsWith("/api/")) return apiResponse(request, env);\n    return handler.fetch(request, env, ctx);\n  }\n};\n`);
await writeFile(path.join(destination,'app/page.tsx'), `import { redirect } from "next/navigation";\nexport default function Home() { redirect('/workspace/index.html#chat'); }\n`);
await writeFile(path.join(destination,'app/layout.tsx'), `import type { Metadata } from 'next';\nexport const metadata: Metadata = { title: '学有据 · AI 学习工作台', description: '基于 DeepSeek、课程依据和分层引导的学习助手。' };\nexport default function Layout({children}:{children:React.ReactNode}) { return <html lang="zh-CN"><body>{children}</body></html>; }\n`);
await writeFile(path.join(destination,'README.md'),'# 学有据 AI 托管服务\n\n此目录由 xueyouju-web/scripts/prepare-hosting.mjs 生成。权威源码为公开 GitHub 仓库 MinnerLee/xueyouju-web。\n\n平台访问权限保持 owner-private。DEEPSEEK_API_KEY 通过 Sites 密钥配置注入，不进入本目录。不要在未增加访问控制前改为公开。\n');
console.log('Hosting source prepared. Runtime secrets remain on the hosting platform.');
