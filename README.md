# mirror / 观己

一款以微信手机端为主、同时适配 PC 的 MBTI 风格人格探索网站。冷灰底色、黑色报告页、侧脸摄影、细线雷达图与胶囊按钮。提供 32 题轻量版和 64 题标准版原创问卷，免费查看四维偏好与解释，完整报告按次解锁。未形成清晰倾向时不生成确定类型，不提供新的付费解锁。

技术栈：Next.js 16（App Router、Turbopack、Cache Components、React Compiler）、React 19、Tailwind CSS v4、shadcn/ui（Radix）、Drizzle ORM + Postgres、Zod。支付层为 provider 抽象：默认 `mock`（演示，不扣款），可切换到微信支付 APIv3（JSAPI / H5 / Native）。

## 页面与接口

| 路径 | 说明 | 渲染 |
| --- | --- | --- |
| `/` | 首页 | 静态 |
| `/quiz` | 32/64 题版本选择、独立续答、题号检查与重新开始 | 静态壳 + 客户端岛 |
| `/result/[id]` | 性格画像；`/result/sample` 为示例 | 部分预渲染，`/result/sample` 全静态 |
| `/report/[id]` | 详细报告，服务端校验付费授权；`/report/sample` 为同版式的免费示例 | 部分预渲染，`/report/sample` 全静态 |
| `/pay/[orderId]` | 订单状态与恢复页（H5 支付回跳、PC 扫码） | 动态 |
| `/my/report` | 当前访客全部测试记录；无记录时引导测试或凭订单号找回 | 动态 |
| `/about` `/preferences` `/types` `/types/[type]` `/help` `/privacy` `/terms` | 测试说明、四维与复测、类型百科、订单帮助及法律页 | 静态 |
| `/robots.txt` `/sitemap.xml` `/manifest.webmanifest` `/opengraph-image` `/icon` | SEO 与分享资源 | 静态 / 按需 |

示例与真实结果共用同一套版式，只是数据不同。`/result/sample` 就是结果页，`/report/sample` 就是详细报告页（`ReportBody`），没有第二套"示例专用"布局。四个章节与两组洞察全部由服务端渲染进 HTML，关闭 JavaScript 也能读完，搜索引擎同样可以收录。

示例处处标注为示例：页头写"示例人格报告"，正文上方有 `SAMPLE REPORT · 示例报告` 说明条，侧栏徽章与手机端标题都显示"示例报告"，`<title>` 同样带"示例报告"。

示例页引导测试而不是引导付费：不显示解锁按钮，也不把价格做成主视觉。说明条、末章链接、收尾区与手机端底栏都指向 `/quiz`，价格只作为一行脚注（免费测试，完整报告 ¥6.9 / 次）。付费面板只出现在真实结果页上。

| 接口 | 说明 |
| --- | --- |
| `POST /api/results` | 提交问卷版本与按题目 ID 关联的答案，服务端校验计分；兼容旧 32 个数字答案 |
| `GET /api/results/[id]` | 读取结果与版本；无清晰倾向时 `type: null`；owner 才返回 `unlocked` |
| `GET /api/results/[id]/answers` | 仅原访客可读取本次答案用于检查重答；不可缓存，其他访客返回 404 |
| `POST /api/orders` | 为结果创建订单，返回支付载荷（mock / jsapi / native / h5） |
| `GET /api/orders/[id]` | 订单状态；未支付订单会向支付方主动查单 |
| `POST /api/reports/recover` | 完整订单号匹配所属访客，恢复签名 cookie；不改变任何支付权限 |
| `POST /api/orders/[id]/mock-pay` | 仅 `PAYMENT_PROVIDER=mock` 时存在，模拟支付成功 |
| `POST /api/payments/wechat/notify` | 微信支付回调：验签、解密、幂等、金额校验、解锁 |
| `GET /api/wechat/oauth` `…/callback` | `snsapi_base` 授权，获取 JSAPI 支付所需 openid |
| `GET /api/wechat/jsconfig` | JS-SDK 分享签名（需配置公众号） |
| `GET /api/health` | 存活与数据库连通性 |

所有接口统一返回 `{ ok: true, data }` 或 `{ ok: false, error: { code, message } }`。

## 本地开发

需要 Node.js ≥ 20.9 与一个 Postgres 实例。

```bash
cp .env.example .env          # 至少填写 DATABASE_URL 与 SESSION_SECRET
npm ci
npm run db:migrate            # 应用 ./drizzle 中的迁移
npm run dev                   # http://localhost:3000
```

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run typecheck` | `next typegen` + `tsc` |
| `npm run lint` | ESLint（含 React Compiler 规则） |
| `npm test` | Vitest 单测：计分、访客 cookie、订单号、微信签名/解密 |
| `npm run test:e2e` | Playwright：手机 393×852 与桌面 1363×936 两套视口的完整流程 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm run analyze` | Turbopack 包体分析 |
| `npm run db:generate` | 修改 `src/db/schema.ts` 后生成新迁移 |
| `node scripts/build-og-fonts.mjs` | 重建 OG 图字体（改动文案后运行） |

## 环境变量

见 `.env.example`。要点：

- `APP_URL`：站点公网地址。它会写进预渲染页面的 canonical / OG / sitemap，因此 **构建时也要提供**（Docker 通过 `--build-arg APP_URL=`）。运行时也必须与浏览器访问的来源一致，订单找回接口以此校验 Origin。
- `SESSION_SECRET`：访客 cookie 与 OAuth state 的 HMAC 密钥，生产环境必填。
- `PAYMENT_PROVIDER`：`mock` 或 `wechat`。`mock` 下界面明确标注"支付演示 · 本次不会扣款"。
- `PRICE_FEN`：完整报告价格（分），默认 690。
- 公开客服邮箱在 `src/lib/site.ts` 的 `site.supportEmail` 配置，当前为 `lakehu0x@gmail.com`；帮助、协议和隐私页共用此值。

## 部署（自托管 Docker + Postgres）

```bash
APP_URL=https://your-domain.com docker compose up -d --build
```

`docker-compose.yml` 会启动 Postgres、执行一次迁移（`migrate` 服务），再以 Next.js standalone 模式启动应用；`/api/health` 用作健康检查。反向代理需转发 `X-Forwarded-For`（H5 支付需要真实客户端 IP）并启用 HTTPS。

订单找回每个来源在 15 分钟内最多尝试 10 次，计数保存在 Postgres，重启应用不会重置。入口代理必须覆盖 `X-Forwarded-For` 或在末尾追加可信来源地址，并阻止绕过代理直连应用；找回接口使用该头的最后一项，缺失时使用 `X-Real-IP`，无法识别的来源共用限流。迁移 `0001_concerned_lucky_pierre.sql` 创建此限流表，需在启用找回功能前应用。

多版本上线前应用 `0002_oval_dagger.sql`，为结果补充问卷 ID、题数、题目 ID 答案、计分和报告版本。既有记录默认归入 `legacy32-v1`，保留原始分数、结果链接和付费权益；历史答案在检查时按冻结的旧题序还原。

## 接入微信支付

1. 在商户平台获取 `mchid`、API 证书序列号、商户私钥（PEM）、APIv3 密钥；开通微信支付公钥或使用平台证书（留空 `WECHAT_PAY_PUBLIC_KEY*` 时系统自动拉取并缓存平台证书）。
2. 关联的公众号 / 服务号 appid 填入 `WECHAT_PAY_APPID`；配置公众号网页授权域名与 JS 接口安全域名为站点域名；`WECHAT_MP_APPID` / `WECHAT_MP_SECRET` 用于 `snsapi_base` 获取 openid 与分享卡片。
3. 商户平台开通 JSAPI（微信内）、H5（手机浏览器）、Native（PC 扫码）三种支付方式。
4. 设置 `PAYMENT_PROVIDER=wechat`，重启。回调地址为 `${APP_URL}/api/payments/wechat/notify`。
5. 用小额真实订单验收：微信内 JSAPI、手机浏览器 H5 回跳 `/pay/[orderId]`、PC 扫码轮询。

## 数据与限制

- 没有注册账号体系。访客由一年期的签名 httpOnly cookie 识别；“我的报告”按时间倒序列出该访客全部测试，不依赖 localStorage。未支付记录可看简要信息，已解锁记录可进入完整报告。
- 清除 cookie 或换浏览器后，输入该访客任意一个完整网站订单号即可恢复身份并展示全部记录；订单可为未支付、已支付等任意状态，恢复身份不会更改支付权限。微信账单应使用商户单号，非微信交易单号。新订单采用 88 位随机部分，并兼容已有订单号；完整订单号是持有即可使用的凭据，只在归属访客的列表、订单页和支付成功页展示，请勿公开。
- 作答进度按版本、题目 ID 和确定题序保存在 localStorage。旧 `mirror.quiz.v1` 草稿自动迁移；新版各版本草稿独立保存。存储失败时使用页面内存继续作答，并提示刷新或关闭会丢失未提交进度。完成后只清除本版本草稿。
- 提交后由服务端计分并持久化。前端的 `unlocked` 仅用于展示，报告页在服务端按已支付订单校验；答案检查生成新记录，原记录与已购报告保留。
- 四维均处于 50–60% 时，页面、历史列表与公开 API 显示“待探索”，创建订单返回 `422 UNCLEAR_RESULT`。近均衡维度同时解释两端。此区间是产品解释规则，并非统计置信区间；历史已购报告仍可阅读。数据库保留旧计分的平分规则，仅用于兼容，不将它作为确定类型展示。
- 免费结果包含四维解释和一条练习；付费内容按偏好强弱、近均衡状态提供场景解读、沟通例句、工作安排及七天实践。四章与两组洞察继续在服务端 HTML 中输出。
- `src/lib/questionnaires.ts` 定义冻结的 `legacy32-v1` 和 `standard64-v1`，每维分别 8/16 题、正反向各半。新增或换题需新版本，不能原地改题 ID 或题序。计分版本为 `preference-v1`，报告内容版本为 `context-v2`。
- 题目为独立原创的体验问卷，并非官方 MBTI 量表，两个版本均未经过心理测量学验证。64 题覆盖更多场景，不保证更准确；预计时间需用真实试测校正。96 题和同题数 A/B 版本按审查建议暂缓，等待理解访谈与试测。

## 目录

```
src/app          路由、API、SEO 文件（robots/sitemap/manifest/OG）
src/components   site（页头/底栏/弹层）、home、quiz、result、report、payment、ui（shadcn）
src/lib          questionnaires（版本/题目）、personality（计分）、preference-content、report-content、quiz-progress、site、session、results、orders、payments/*、og/*
src/db           Drizzle schema、连接、迁移脚本
drizzle          SQL 迁移
docs             设计证据截图与原型验收记录
tests            unit（Vitest）、e2e（Playwright）
```
