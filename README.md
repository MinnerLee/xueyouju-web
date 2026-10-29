# 学有据 · Xueyouju

**每一步理解，都有依据。**

面向工科数学分析和 C 语言的开源助学网站，包含项目介绍和可操作的学习工作台。当前版本为 **v0.1 固定题库演示**：课程依据、三级提示、小测和本地记录均可使用，尚未接入模型 API、PDF 检索、账号或服务器数据库。

## 运行

需要 Node.js 22 或更新版本，无第三方依赖，无需 `npm install`。

```sh
npm start
```

打开终端输出的 `http://127.0.0.1:4173`。不要直接双击 HTML，浏览器的 ES Module 需要通过 HTTP 加载。

```sh
npm test          # 评分、课程数据、记录恢复测试
npm run build    # 生成 dist 静态站点
npm run preview  # 预览 dist
npm run package  # 从已提交、干净的 Git 工作区生成源码 ZIP
```

如果端口被占用，可设置 `PORT` 环境变量。预览服务只监听本机回环地址。

## 当前功能

- 项目首页、课程入口、学习工作台、学习记录、项目说明。
- 工科数学分析：连续与可导、极限与函数值、中值定理条件。
- C 语言：循环边界、数组下标、值传递。
- 每个知识点包含自编依据、三级提示、完整解析与一道迁移小测。
- 自由思路可保存；不会假装对开放回答进行 AI 评分。
- 小测选择题使用固定规则评分，一次练习只记一次结果，重新练习会建立新记录。
- 记录区分独立答对、使用提示/解析答对、答错，并说明复练理由。
- 数据只写入当前浏览器 localStorage，最多 500 次作答，支持 JSON 导出与清空。
- 响应式布局、键盘操作、表单标签和减少动画偏好。

本项目不声称已验证学习效果，不以单次作答推断掌握程度。C 语言例子是明确标注的静态推演，不会执行用户代码。

## 目录

```text
xueyouju-web/
  index.html
  assets/mark.svg
  src/
    app.js                 # 页面、事件和学习流程
    courses.js             # 原创课程示例、确定性评分
    storage.js             # 本地记录校验和持久化
    styles.css
  docs/
    original-notes.md       # 可追溯的原创依据
    materials.md            # 数学资料接入与范围说明
    architecture.md         # 当前结构及后续扩展
    deployment.md           # GitHub 发布步骤
  scripts/                 # 零依赖开发、构建与打包脚本
  tests/
  .github/workflows/       # 检查与 Pages 部署
```

## GitHub 与部署

目标仓库：<https://github.com/MinnerLee/xueyouju-web>

推送后在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，再运行 `Deploy website to GitHub Pages` 工作流。部署成功后的 URL 以 Actions 输出为准。详见 [部署说明](docs/deployment.md)。

所有资源均使用相对路径，支持 GitHub Pages 的仓库子路径。也可以将 `dist/` 交给任意静态文件托管服务。

## 课程资料与后续研发

用户提供的教材、题册和解析仅作本地参考，**未收入代码仓库或发布包，也未建成检索索引**。网页中的依据全部来自 [自编学习札记](docs/original-notes.md)，不伪造教材页码。资料盘点和接入约定见 [资料说明](docs/materials.md)。

后续可在保持课程数据结构的基础上增加 FastAPI、SQLite、课程检索和模型适配层。模型密钥必须保留在后端。先核验资料授权、公式和题目评分，再扩大题库。参考 [架构与路线图](docs/architecture.md)。

## 参与贡献

欢迎报告界面问题、课程示例错误与无障碍问题；提交方法见 [CONTRIBUTING.md](CONTRIBUTING.md)。请勿在 Issue、代码或附件中提交个人学习记录、凭据、教材全文或未经授权的试题。

## 许可

代码、本站图形及自编示例使用 [MIT License](LICENSE)。外部教材、试卷、第三方题册及其原有许可不因本仓库开源而改变。
