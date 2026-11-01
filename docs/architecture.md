# v0.2 架构

前端使用原生 JavaScript ES Modules 和 hash 路由，构建时将 Marked、DOMPurify、KaTeX 复制到本站资源目录，无运行时 CDN。

浏览器 → POST /api/chat → 访问控制与输入校验 → 按课程查找札记 → 后台提示词与资料 → DeepSeek HTTPS → SSE → 浏览器渲染。

`server/prompt.js` 是提示词权威来源。客户端只能提交交替的 user/assistant 消息；资料在系统上下文中明确标为待分析数据，不拥有指令权限。引用校验只检查 ID 是否出现在实际检索结果中，不能自动证明引用语义支撑结论。

`server/api.js` 使用标准 Request/Response，Node 与 Cloudflare Worker 共用。`POST /api/access` 验证应用密钥，`POST /api/chat` 每次重新校验；缺少后台密钥配置时拒绝请求，不依赖客户端隐藏按钮或平台登录。普通远程 Node 服务要求至少 24 字符应用口令；本机默认绑定 127.0.0.1，也需要应用密钥。Sites 仅托管 API，旧网页通过 `server/service.js` 跳回主站。

流式事件依次为 meta（依据）、status、delta、done 或 error。后端只转发公开答案，不转发模型私有推理。停止生成会取消上游请求；异常断流保留部分内容，但不标为完成。

会话存 localStorage，无后台数据库。每轮发送近期最多 10 对完整消息，且受总字符数限制；失败/停止轮次不进入后续上下文。应用访问口令只留页面内存，DeepSeek Key 从不发往浏览器。

每实例每来源 IP 每分钟 15 次、总并发 3；同一 IP 在十分钟内累计 10 次错误密钥后暂时拒绝验证，成功验证会清空错误计数。Node 使用实际 socket 地址，Worker 使用平台注入的连接 IP。后端超时 180 秒，单次输出最多 4096 tokens。实例内限流不构成跨实例配额或严格消费上限。扩大开放前应增加账号级持久化额度和预算控制。

后续方向：核验授权教材与公式、扩充检索和引用评测、账号配额与跨设备记录。C 语言当前仅静态分析，运行代码需要另建隔离沙箱。
