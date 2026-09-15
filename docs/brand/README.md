# 观己 mirror · 品牌标识

两道相向的镜面轮廓围合出向内观察的空间，中央暖色圆点代表正在被看见的自己。沿用冷灰纸、近黑墨色和克制的暖色点缀，配合原有 Manrope / 观己字标。

![Logo family](./logo-preview.png)

## 资产

所有交付资产位于 `public/assets/brand/`，SVG 背景透明，文字已转为轮廓，不依赖字体加载。

| 文件 | 用途 |
| --- | --- |
| `logo-ink.svg` / `logo-paper.svg` | 浅底 / 深底横排 Logo |
| `logo-mono.svg` / `logo-mono-paper.svg` | 深色 / 反白单色横排 Logo |
| `logo-en-ink.svg` / `logo-en-paper.svg` / `logo-en-mono.svg` / `logo-en-mono-paper.svg` | 英文站横排 Logo（mirror \| look within），配色同上 |
| `mark-ink.svg` / `mark-paper.svg` | 浅底 / 深底独立符号 |
| `mark-mono.svg` / `mark-mono-paper.svg` | 深色 / 反白单色独立符号 |
| `app-icon.svg` | 带冷灰底的应用图标源文件 |
| `icon-64.png`, `icon-180.png`, `icon-192.png`, `icon-512.png` | 浏览器、手机桌面与品牌信息图标 |
| `icon-maskable-512.png` | 保留系统裁切安全区的应用图标 |
| `src/app/favicon.ico` | 16 / 32 / 48 px 浏览器兼容图标 |

## 使用与维护

- 页头与分享图使用同一个 `BrandLogo`，图标使用 `BrandMark` / `BrandAppIcon`。源文件位于 `src/components/brand/`。
- 保持图形比例；独立符号最小 16 px，横排组合建议至少 168 px 宽。深底使用 paper 版本，单色场景使用 mono 版本。
- 页头外框和导航保持原尺寸。手机页头只显示符号和 mirror 字标，不带竖线和副名，中英文相同：`BrandLogo tagline={false}`，宽度 `brandLogoWidth(locale, 168, false)`（109 px），字形比例与 168 px 中文横排一致。桌面页头显示完整横排，中文 194 px。
- 英文站把竖线后的“观己”换成 look within（Manrope 500，13 px，无字距），画布宽 232（中文为 194），字形比例不变：桌面页头 232 px，手机页头与中文相同、不带副名；分享图用 `brandLogoWidth(locale, 中文宽度)` 换算。
- `BrandLogo` 通过 `locale` 选择副名，`tagline={false}` 去掉竖线和副名并把画布收窄为 126；`app/global-not-found.tsx` 不在 `[lang]` 下，保留中文 Logo。
- 应用图标使用不透明冷灰底；符号始终位于中心安全区，圆形和圆角裁切均保留完整图形。
- 修改组件后运行 `npm run brand:build`，同步导出资产及此预览图。已有 `/icon`、`/apple-icon` 路由继续提供 PNG。
- 英文字标轮廓来自本项目 Manrope 650；中文轮廓来自项目已用于分享图的 Noto Sans SC 子集。
- 分享图中的 Logo 使用直接函数调用，向 Satori 提供原生 SVG 元素；不要改回嵌套 React 组件，否则图片可能空白。

## 首页人像

- 英文首页和英文分享图使用 `src/assets/portrait.jpg`；中文首页和中文分享图使用 `src/assets/portrait-zh.jpg`。首页 `<Image>` 与 `portraitDataUrl(locale)` 都按语言选择，替换人像时同步改 `pageMessages.home.portraitAlt`。
- 中文人像：Pexels 照片 3754248「Woman in White Collared Shirt」，摄影 Ba Tik，Pexels License（可免费商用，无需署名），来源 https://www.pexels.com/photo/woman-in-white-collared-shirt-3754248/ ，下载 1600×2256。
- 原图墙面为暖灰色。为与页面冷灰纸色一致，墙面经柔和蒙版调到纸色色相并提亮（Lab 约 L 88、a −1.9、b −1.8，保留墙面纹理），皮肤、头发、白衣和项链保持原色；再用 `npm run optimize:images -- <调色后的图> src/assets/portrait-zh.jpg 1200` 输出 1200 px 宽。
- 首屏文字压在人像上：手机端文案后有纸色蒙层、底部 dock 有纸色渐隐，桌面图注下有墨色渐隐。换图后在 390×749、393×852 和 1363×936 检查文案、dock 与图注是否清晰。

## 验证记录

2026-09-10：类型检查、代码检查、52 项单元测试、生产构建和 42 项手机 / 桌面端到端测试通过。已核对图标、favicon、manifest 资产与三类分享图的有效内容、尺寸和响应，并更新首页视觉基准。

- 首页：[手机 393×852](./home-mobile.png)、[桌面 1363×936](./home-desktop.png)
- 分享图：[首页](./og-home.png)、[测试结果](./og-result.png)、[人格类型](./og-type.png)
