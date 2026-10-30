# 学有据 · Xueyouju

**每一步理解，都有依据。**

面向工科数学分析与 C 语言的开源学习工作台。v0.2 增加后台接入 DeepSeek 的聊天助手，保留六个原创知识点、三级提示和固定规则小测。

- [公开项目网站](https://minnerlee.github.io/xueyouju-web/)
- [托管 AI 工作台](https://xueyouju-ai-minnerlee.minnerlee233.chatgpt.site/workspace/index.html#chat)：当前仅站点所有者登录后使用。
- [源码与版本下载](https://github.com/MinnerLee/xueyouju-web)

## 运行

需要 Node.js 22 或更新版本。先运行 `npm ci`，复制 `.env.example` 为 `.env`，在本机文件中填写 `DEEPSEEK_API_KEY`，然后运行 `npm start`。

打开 http://127.0.0.1:4173/#chat。Key 只由后台读取，不填写到网页。未配置密钥仍可浏览示例练习。环境文件不进入 Git、静态构建或发布包。

```sh
npm test          # 课程、聊天协议、权限、流式解析与记录测试
npm run build     # 构建静态页面及第三方依赖
npm run preview   # 预览 dist，同时启动本机 API
npm run package   # 从干净的 Git HEAD 生成源码 ZIP
```

## 功能

- 三栏聊天工作台：多会话、流式对话、课程资料与笔记。
- 引导学习、概念讲解、检查解答、针对练习、学习计划五种模式。
- 多轮上下文、停止、重试、Markdown、LaTeX、复制回答、笔记与会话导出。
- 会话、草稿、资料在当前浏览器保存；最多 30 个会话、每会话 40 轮。
- 按课程匹配六个原创札记，显示实际依据，检查引用 ID。
- 支持粘贴文字或导入 txt/md（最多 18000 字）；发送时交给后台与 DeepSeek。
- 系统提示词、模型密钥放后台；前端可设置自建后台和临时访问口令。
- 原有固定小测继续使用可复现规则评分，不以单次表现推断掌握程度。

尚未实现 PDF 全文检索、代码执行、联网工具、跨设备会话同步。AI 开放答案属于建议，需核验。

## 目录与文档

| 文件 | 作用 |
| --- | --- |
| src/chat.js、src/chat.css | 聊天工作台和手机布局 |
| src/chat-store.js、src/chat-render.js | 会话存储、清洗与公式 |
| server/prompt.js | 完整学习助手提示词 |
| server/chat.js、server/api.js | 模型代理、检索与访问控制 |
| shared/sse.js | 共用流式解析 |
| scripts/prepare-hosting.mjs | 生成独立 Sites 托管源码 |

[助手说明](docs/ai-assistant.md) · [部署](docs/deployment.md) · [架构](docs/architecture.md) · [验证记录](docs/validation.md)

## 资料与许可

教材、题册和解析仅作本地参考，**不含在仓库或发布包，也未建立全文索引**。依据来自[原创札记](docs/original-notes.md)，不伪造教材页码。[资料范围](docs/materials.md)。

代码、图形和自编示例使用 [MIT](LICENSE)。Marked、DOMPurify、KaTeX 使用各自许可，构建时附带许可证。外部教材的权利不因源码开源而改变。[贡献指南](CONTRIBUTING.md)。
