# 发布与打包

## 本地检查

```sh
npm test
npm run build
npm run preview
```

`dist/` 只复制公开页面、课程示例、资源、技术文档和许可证。开发服务器也只提供这几个公开目录，Git 元数据、私有资料与脚本不会通过本地预览开放。

## 上传到 GitHub

在 GitHub 创建一个空的公开仓库，例如 `MinnerLee/xueyouju-web`。如果本项目已经绑定该地址，请直接使用现有远端。

```sh
git init -b main
git add .
git commit -m "feat: add Xueyouju learning website"
git remote add origin https://github.com/MinnerLee/xueyouju-web.git
git push -u origin main
```

已初始化、已提交或已有远端时，跳过对应命令。上传前用 `git status` 和 `git ls-files` 核对文件；原 PDF 和本地学习记录不属于公开发布内容。

## GitHub Pages

在仓库 Settings → Pages 中将构建来源选择为 GitHub Actions。之后推送 main，或在 Actions 手动运行 `Deploy website to GitHub Pages`。等待构建与部署都成功，在该工作流的 deployment 输出中打开实际网址。

预期仓库路径为 `https://minnerlee.github.io/xueyouju-web/`，**在部署成功前不把它当作已上线地址**。若 Fork，更新首页和 README 的仓库链接；静态资源本身使用相对路径。

流程参考：[GitHub 官方文档：自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 源码包

工作区提交完成后运行：

```sh
npm run package
```

输出 `release/xueyouju-web-source.zip`，从 Git HEAD 的已跟踪文件打包，包含源码、测试、文档和许可证，不包含 `.git`、PDF、运行数据、依赖目录。工作区有未提交文件时脚本拒绝打包，避免归档落后于当前修改。

静态托管时上传 `dist/` 的内容。源码 ZIP 和静态站点包用途不同：前者用于继续开发，后者可直接交给静态服务器。
