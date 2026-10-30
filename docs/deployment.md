# 部署与打包

## 当前方案

GitHub Pages 保留公开项目网站；Sites 管理的 Cloudflare Workers 承载 AI 页面和同域 API。AI 站点保持 **owner-private**，登录站点所有者的 ChatGPT 账户使用。公开源码不等于公开共享付费 API。

GitHub Pages 不执行后端，其 AI 页面提供托管入口，也支持配置自建后台。浏览器不直接调用 DeepSeek。

## 本机与普通服务器

运行 npm ci，复制 .env.example 为 .env，填写密钥后 npm start。

| 环境变量 | 说明 |
| --- | --- |
| DEEPSEEK_API_KEY | 模型密钥，仅后台 |
| DEEPSEEK_MODEL | 未指定时的默认模型，deepseek-flash |
| HOST | 默认 127.0.0.1，可外部监听 0.0.0.0 |
| PORT | 默认 4173 |
| APP_ACCESS_TOKEN | 外部监听必须配置至少 24 字符 |
| ALLOWED_ORIGINS | 独立前端 origin，逗号分隔 |

远程 Node 服务配置 HTTPS 反向代理，并关闭 SSE 缓冲。应用访问口令填入网页连接设置，刷新后重新输入；它不是 DeepSeek Key。预览只开放公开目录，不提供 .env、.git 或后台源码。

## Sites 更新

使用独立已初始化、已注册的 Vinext checkout，保留其 .openai/hosting.json 中的项目身份。

```sh
npm ci
npm test
node scripts/prepare-hosting.mjs <托管目录绝对路径>
```

脚本复制静态页面到 public/workspace、共用 API 到 assistant，配置 Worker 的 /api/* 处理。按 Sites 工作流构建、推送、打包并发布相同版本。

在托管平台秘密变量中设置 DEEPSEEK_API_KEY，普通变量 DEEPSEEK_MODEL=deepseek-flash、SITE_PRIVATE_MODE=true。SITE_PRIVATE_MODE 只能用于已由平台强制保护的所有者私有站点。公开访问前必须改为 false 并配置应用口令或正式认证和持久化配额。

密钥不能写入源码、manifest、前端构建变量或静态输出。当前未购买额外付费托管套餐；模型调用消耗 DeepSeek 余额，参数以[官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)为准。

## GitHub 与打包

推送 main 后工作流执行 npm ci、npm test、npm run build 并部署 Pages。提交后 npm run package 生成 release/xueyouju-web-source.zip，内容来自干净的 Git HEAD。

将 dist 内容压缩为 xueyouju-web-static.zip 可用于静态托管，但实际聊天仍需后台。源码包包含 Node 后台，不含密钥。PDF、私有资料、依赖、环境文件不进入发布包。
