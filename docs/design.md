# 视觉设计规范 ·「深水」柔和版 P3R

参照 Persona 3 Reload 菜单的构图语言：深蓝水下氛围、倾斜的纸片面板、斜切楔形、大号压缩字体、编号式菜单。但整体要**柔和、不晃眼**，适合长时间学习阅读。不使用任何游戏素材（图像、字体、音效、Logo）。

## 文件分工

| 文件 | 内容 |
| --- | --- |
| `src/theme.css` | 字体、设计令牌、背景视频层、页头页脚、通用按钮、纸幕转场、HUD。**全站唯一的令牌来源** |
| `src/home.css` | 首页（`body[data-page="home"]`）各区块 |
| `src/pages.css` | 示例练习 learn、学习记录 records、关于 about、AI 学习助手 chat（含密钥入口 `.ai-access`） |
| `src/styles.css`、`src/chat.css` | 旧的基础布局，保留结构；颜色、字体等视觉属性一律由 home.css / pages.css 覆盖 |
| `src/shell.js` | 转场、HUD、音效（默认关闭） |
| `src/video-bg.js` | 背景视频（`assets/video/tide.*`），减少动态效果 / 省流量 / 用户关闭时只显示封面 |

## 令牌（定义在 theme.css，页面样式只引用，不新增颜色字面量）

- 字体：`--p-display`（英文大标题）、`--p-cond`（英文小标签，大写加字距）、`--p-cjk`（中文标题）、`--p-body`（正文）、`--p-mono`
- 直接压在背景视频上的文字：`--p-on-bg`、`--p-on-bg-soft`、`--p-on-bg-muted`，分隔线 `--p-line`
- 面板（纸片）：`--p-panel`、`--p-panel-2`、`--p-panel-ink`（标题）、`--p-panel-text`（正文）、`--p-panel-muted`、`--p-panel-line`、`--p-panel-link`
- 半透明深色条带：`--p-glass`
- 强调：`--p-accent`（雾青，主强调、链接、焦点）配 `--p-accent-ink`；`--p-select`（珊瑚，只用于「当前选中 / 主操作悬停」）配 `--p-select-ink`
- 状态：`--p-ok`、`--p-warn`、`--p-error`
- 阴影：`--p-shadow`（柔和投影）、`--p-shadow-hard`（P3R 式偏移硬投影，已减弱）、`--p-text-shadow`
- 动效：`--p-ease`、`--p-dur`；倾斜：`--p-tilt`（大块，-1.5°）、`--p-tilt-sm`（小标签，-3°）
- 浅色 / 深色两套主题已在 theme.css 切好，页面样式不要再写 `html[data-theme=...]` 分支，除非确有必要

## 硬性约束（「柔和」的具体含义）

1. 不出现大面积纯白（#fff）、纯红、高饱和电光青 / 品红；最亮的面只用 `--p-panel`。
2. 倾斜：大面板 ≤ 2°，小标签 / 按钮 ≤ 4°；正文段落不倾斜。
3. 不做无限循环动画（闪烁、故障抖动、跑马灯、脉冲）。允许：入场一次性的位移 + 淡入（≤ 12px，≤ 500ms），悬停的 transform / 颜色过渡。
4. 只动画 `transform` 和 `opacity`；不用 `backdrop-filter`、全屏 `mix-blend-mode`、`filter: blur` 叠在视频上。
5. 文字对比度达到 WCAG AA：面板上用 panel 系列颜色，视频上用 on-bg 系列颜色并保留 `--p-text-shadow`。
6. 每个页面都要适配 ≥ 1280px、768px、375px 三档宽度，不出现横向滚动。
7. `prefers-reduced-motion` 下全部静止（theme.css 已有全局兜底，不要用 `!important` 动画去对抗它）。
8. 不改动业务逻辑、路由、数据存储、聊天协议，不改 `tests/`。

## 视觉语汇

- **纸片面板**：`--p-panel` 底，轻微倾斜，`--p-shadow-hard`；内部内容保持水平（必要时内层反向旋转）。
- **编号菜单**：大号 `--p-display` 数字 + `--p-cjk` 标题；悬停时左侧伸出一条 `--p-select` 斜切楔形（`clip-path` 或 `skewX`），文字略右移。
- **眉标**：`--p-cond` 大写英文 + 字距 0.2em，颜色 `--p-accent`。
- **条带**：`--p-glass` 半透明深色横条承载流程、数字等次要信息，让视频透出来。
