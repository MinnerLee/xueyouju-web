# 部署与打包

## 当前方案

GitHub Pages 是唯一网页入口；Sites 管理的 Cloudflare Workers 仅承载 `/api/*`。原独立工作台文件已移除，旧网址跳回主站 `#chat`。AI 改为应用访问密钥解锁，不再要求站点所有者的 ChatGPT 登录。

GitHub Pages 不执行后端，主站通过 HTTPS 跨域调用受密钥保护的 API。`src/hosting.js` 定义正式主站对应的后台；fork 与本机默认连接同域后台，自行部署时修改该映射。浏览器不直接调用 DeepSeek。

## 本机与普通服务器

运行 npm ci，复制 .env.example 为 .env，填写密钥后 npm start。

| 环境变量 | 说明 |
| --- | --- |
| DEEPSEEK_API_KEY | 模型密钥，仅后台 |
| DEEPSEEK_MODEL | 未指定时的默认模型，deepseek-flash |
| HOST | 默认 127.0.0.1，可外部监听 0.0.0.0 |
| PORT | 默认 4173 |
| APP_ACCESS_TOKEN | AI 解锁密钥，必须作为秘密变量配置；远程 Node 监听要求至少 24 字符 |
| ALLOWED_ORIGINS | 独立前端 origin，逗号分隔 |

远程 Node 服务配置 HTTPS 反向代理，并关闭 SSE 缓冲。应用密钥填入主站 AI 页面的解锁框，刷新后重新输入；它不是 DeepSeek Key。预览只开放公开目录，不提供 .env、.git 或后台源码。

## Sites 更新

使用独立已初始化、已注册的 Vinext checkout，保留其 .openai/hosting.json 中的项目身份。

```sh
npm ci
npm test
node scripts/prepare-hosting.mjs <托管目录绝对路径>
```

脚本移除已生成的 `public/workspace`，复制共用 API 到 assistant，配置 Worker 处理 `/api/*`，其他路径跳回主站。按 Sites 工作流构建、推送、打包并发布相同版本。

在托管平台秘密变量中设置 `DEEPSEEK_API_KEY`、`APP_ACCESS_TOKEN`；普通变量设置 `DEEPSEEK_MODEL=deepseek-flash`、`ALLOWED_ORIGINS=https://minnerlee.github.io`。不再使用 `SITE_PRIVATE_MODE` 绕过应用认证。首次从旧私有工作台迁移时，先部署并验证正确密钥通过、错误密钥拒绝以及旧网页移除，再将平台访问权限改为 public，让主站可以跨域请求；模型调用仍由应用密钥保护。

密钥不能写入源码、manifest、前端构建变量或静态输出。当前未购买额外付费托管套餐；模型调用消耗 DeepSeek 余额，参数以[官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)为准。

## GitHub 与打包

推送 main 后工作流执行 npm ci、npm test、npm run build 并部署 Pages。提交后 npm run package 生成 release/xueyouju-web-source.zip，内容来自干净的 Git HEAD。

将 dist 内容压缩为 xueyouju-web-static.zip 可用于静态托管，但实际聊天仍需后台。源码包包含 Node 后台，不含密钥。PDF、私有资料、依赖、环境文件不进入发布包。
