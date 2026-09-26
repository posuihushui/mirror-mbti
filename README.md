# mirror / 观己

一款以微信手机端为主、同时适配 PC 的 MBTI 风格人格探索网站，有中英文两种语言：英文为默认语言，使用不带前缀的地址，中文位于 `/zh`，两种语言共用全部版式。冷灰底色、黑色报告页、侧脸摄影、细线雷达图与胶囊按钮。提供 32 题轻量版和 64 题标准版原创问卷，测试结果（四维偏好与解释）免费查看，完整报告按次解锁，一次解锁包含完整报告与双人指南。每份完成的问卷都给出四个字母，每个维度另标清晰度；接近均衡不会扣下类型，也不会阻止解锁。

技术栈：Next.js 16（App Router、Turbopack、Cache Components、React Compiler）、React 19、Tailwind CSS v4、shadcn/ui（Radix）、Drizzle ORM + Postgres、Zod。支付层为 provider 抽象，按订单语言选用：中文订单由 `PAYMENT_PROVIDER` 决定，默认 `mock`（演示，不扣款），可切换到微信支付 APIv3（JSAPI / H5 / Native）；英文订单由 `EN_PAYMENT_PROVIDER` 决定，默认 `mock`，可切换到 `waffo`（Waffo Pancake 托管的银行卡收银台）或 `crypto`（Ethereum / Solana 上的 USDC / USDT 直接收款，无第三方网关）。每种语言同一时间只启用一种支付方式。

## 页面与接口

英文页面使用不带前缀的地址（`/quiz`），中文页面加 `/zh` 前缀（`/zh/quiz`），下表只列不带前缀的路径。页面都在 `src/app/[lang]` 下：`src/proxy.ts` 把不带前缀的地址重写到内部的 `/en/…`，旧的 `/en/…` 地址由 `next.config.ts` 308 跳转到不带前缀的地址。结果、报告、订单、分享与双人指南页面会跳转到内容所属的语言（结果的语言即其问卷的语言）。

| 路径 | 说明 | 渲染 |
| --- | --- | --- |
| `/` | 首页 | 静态 |
| `/quiz` | 32/64 题版本选择、独立续答、题号检查与重新开始；64 题版本分四段作答 | 静态壳 + 客户端岛 |
| `/result/[id]` | 测试结果；`/result/sample` 为示例 | 部分预渲染，`/result/sample` 全静态 |
| `/report/[id]` | 完整报告，服务端校验付费授权；`/report/sample` 为同版式的免费示例 | 部分预渲染，`/report/sample` 全静态 |
| `/pay/[orderId]` | 订单状态与恢复页（H5 支付回跳、PC 扫码、银行卡收银台返回） | 动态 |
| `/my/report` | 当前访客全部测试记录；凭订单号找回默认折叠，`?recover=1` 时展开（`/help` 由此进入） | 动态 |
| `/pairing` | 双人指南介绍与虚构示例 | 静态 |
| `/s/[token]` | 公开的相处说明书（单人分享，免费） | 动态 |
| `/t/[token]` `/t/[token]/join` | 双人指南邀请页；受邀方选择结果并确认同意 | 动态 |
| `/compare/[id]` | 双人指南，只有双方的签名访客可读 | 动态 |
| `/my/pairing` `/my/shares` | 我的双人指南与邀请；我的相处说明书 | 动态 |
| `/report/[id]/image` `/compare/[id]/image` `/s/[token]/image` | 报告摘要图、双人指南图与相处说明书图（PNG），访问权限与对应页面相同；二维码只指向公开页面 | 按需 |
| `/about` `/preferences` `/types` `/types/[type]` `/help` `/privacy` `/terms` | 测试说明、四维与复测、类型百科、订单帮助及法律页 | 静态 |
| `/robots.txt` `/sitemap.xml` `/manifest.webmanifest` `/opengraph-image` `/icon` `/llms.txt` `/llms-full.txt` | SEO 与分享资源；中文的 manifest、首页 OG 图与 llms 文件在 `/zh` 下 | 静态 / 按需 |

示例与真实结果共用同一套版式，只是数据不同。`/result/sample` 就是结果页，`/report/sample` 就是完整报告页（`ReportBody`），没有第二套"示例专用"布局。四个章节与两组洞察全部由服务端渲染进 HTML，关闭 JavaScript 也能读完，搜索引擎同样可以收录。

示例处处标注为示例：报告页页头、正文上方的说明条、侧栏徽章、手机端标题行、报告摘要图的眉题与 `<title>` 都写“示例报告”；英文页面写 Sample report（眉题为 SAMPLE REPORT）。两种语言不在同一个字符串里并列。

示例页只引导测试：不显示解锁按钮、付费面板或任何价格。说明条、末章链接、收尾区与手机端底栏都指向 `/quiz`，文案只说明测试免费，不提任何购买。测试之前的页面（首页、测试页、两个示例页、`/about`、`/preferences`、`/types` 与两份 llms 文件）都不报价，也不暗示有东西出售；价格只出现在完成测试后才能到达的购买界面：真实结果页的解锁底栏与付费面板、支付弹层和 `/pay/[orderId]`。`/help`、`/terms`、`/privacy` 仍完整说明支付规则。

| 接口 | 说明 |
| --- | --- |
| `POST /api/results` | 提交问卷版本与按题目 ID 关联的答案，服务端校验计分；兼容旧 32 个数字答案 |
| `GET /api/results/[id]` | 读取结果与版本；`type` 始终是四个字母，另附各维度的 `clarity`；owner 才返回 `unlocked` |
| `GET /api/results/[id]/answers` | 仅原访客可读取本次答案用于检查重答；不可缓存，其他访客返回 404 |
| `POST /api/orders` | 为结果创建订单，价格、币种与支付方式跟随结果所用问卷的语言；返回支付载荷（mock / jsapi / native / h5 / redirect / ethereum / solana），链上支付需传 `network` |
| `GET /api/orders/[id]` | 订单状态；未支付订单会向支付方主动查单；银行卡与链上订单过期后 24 小时内仍会查询，晚到的付款照常解锁 |
| `POST /api/orders/[id]/payer` | Ethereum 订单：验证并记录签署订单挑战的钱包，只能设置一次，只认该钱包的转账 |
| `POST /api/reports/recover` | 完整订单号匹配所属访客，恢复签名 cookie；不改变任何支付权限 |
| `POST /api/orders/[id]/mock-pay` | 仅当订单所属语言的支付方式为 `mock` 时可用，模拟支付成功 |
| `POST /api/payments/wechat/notify` | 微信支付回调：验签、解密、幂等、金额校验、解锁 |
| `POST /api/payments/waffo/webhook` | Waffo Pancake 回调：对原始请求体验证 RSA 签名，按 `<eventType>:<eventId>` 幂等，存储前去掉买家邮箱；`order.completed` 解锁，退款事件只记录、不收回报告 |
| `GET /api/wechat/oauth` `…/callback` | `snsapi_base` 授权，获取 JSAPI 支付所需 openid |
| `GET /api/wechat/jsconfig` | JS-SDK 分享签名（需配置公众号；页面仅在 `WECHAT_SHARE_ENABLED=true` 时启用分享） |
| `POST` `GET /api/shares`、`DELETE /api/shares/[id]` | 生成、列出、关闭相处说明书（公开快照） |
| `GET /api/results/[id]/share-options` | 结果所有者生成说明书时的候选句与预览 |
| `POST /api/share-events` | 第一方分享事件；不代表消息已实际发出 |
| `POST /api/comparison-invitations`、`DELETE …/[id]`、`GET …/options` | 创建、撤回双人指南邀请；列出可用于邀请的结果 |
| `POST /api/comparisons`、`DELETE /api/comparisons/[id]` | 受邀方确认同意后生成双人指南；任一方撤回后双方都无法再读 |
| `POST /api/comparison-continuations`、`DELETE …/[id]` | 保存或删除加入邀请的意图，付款或找回身份后可继续 |
| `GET` `POST /api/pairing-access` | 查询结果能否用于双人指南；`POST` 按已支付订单核对权益 |
| `GET /api/health` | 存活与数据库连通性 |

所有接口统一返回 `{ ok: true, data }` 或 `{ ok: false, error: { code, message } }`。

## 本地开发

需要 Node.js ≥ 20.9 与一个 Postgres 实例。

```bash
cp .env.example .env          # 至少填写 DATABASE_URL 与 SESSION_SECRET
npm ci
npm run db:migrate            # 应用 ./drizzle 中的迁移
npm run dev                   # http://localhost:3000（英文），中文在 /zh
```

更新代码后若有新的 `drizzle/*.sql`，启动前再次运行 `npm run db:migrate`。迁移脚本自动按 Next.js 规则读取 `.env*`（默认开发环境，生产环境设置 `NODE_ENV=production`）；显式传入的环境变量优先，已应用的迁移不会重复执行。

分享功能需要 `0004_flippant_brother_voodoo.sql` 创建的表。若结果页正常、生成相处说明书却返回 `503 SHARE_UNAVAILABLE`，先确认应用实际连接的数据库已执行该迁移。

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run typecheck` | `next typegen` + `tsc` |
| `npm run lint` | ESLint（含 React Compiler 规则） |
| `npm test` | Vitest 单测：计分与问卷、访客 cookie、订单号与找回、微信 / Waffo / 链上支付、分享与双人指南、i18n、SEO |
| `npm run test:e2e` | Playwright：手机 393×852 与桌面 1363×936 两套视口的完整流程；需要 `DATABASE_URL` 与已构建的应用 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm run analyze` | Turbopack 包体分析 |
| `npm run db:generate` | 修改 `src/db/schema.ts` 后生成新迁移 |
| `npm run brand:build` | 品牌图形改动后刷新 `public/assets/brand/`、`src/app/favicon.ico` 与 `docs/brand/logo-preview.png` |
| `node scripts/build-og-fonts.mjs` | 重建 OG 图的中文字体子集（改动 OG 图中的中文文案后运行） |

## 环境变量

见 `.env.example`。要点：

- `APP_URL`：站点公网地址。它会写进预渲染页面的 canonical / OG / sitemap，因此 **构建时也要提供**（Docker 通过 `--build-arg APP_URL=`）。运行时也必须与浏览器访问的来源一致，订单找回接口以此校验 Origin。
- `SESSION_SECRET`：访客 cookie 与 OAuth state 的 HMAC 密钥，生产环境必填。
- `PAYMENT_PROVIDER`：中文订单的支付方式，`mock` 或 `wechat`。`mock` 不扣款，界面与真实支付一样不带“演示”字样（按钮为“确认支付”），是否为 mock 只由这个环境变量决定。
- `EN_PAYMENT_PROVIDER`：英文订单的支付方式，`mock`、`waffo` 或 `crypto`，同一时间只启用一种（选 `waffo` 即取代链上收款，而不是并列）。`mock` 下英文界面同样不带 Demo 字样。
- `PRICE_FEN` / `PRICE_USD_CENTS`：完整报告价格，分别按分（中文订单，默认 690 即 ¥6.9）和美分（英文订单，默认 690 即 $6.9）计。
- `WAFFO_*`：`EN_PAYMENT_PROVIDER=waffo` 时必填。买家跳转到 Waffo Pancake 托管收银台付款后回到 `/pay/[orderId]`，本站不收集卡号；税费加在价格之上。Webhook 地址为 `${APP_URL}/api/payments/waffo/webhook`。没有退款流程：购买即为最终交易，退款事件只记录，不收回报告。
- `CRYPTO_EVM_RECEIVER` + `ETHEREUM_RPC_URL`、`CRYPTO_SOLANA_RECEIVER` + `SOLANA_RPC_URL`：`EN_PAYMENT_PROVIDER=crypto` 时，收款地址与 RPC 都已配置的网络才会出现在结账中。付款直接进入收款地址，从链上读取确认；Ethereum 订单只认签署了订单挑战的钱包，Solana 订单各带独立的 Solana Pay reference。订单有效期 30 分钟，过期后 24 小时内仍会查询。
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`：GA4 衡量 ID（`G-` 开头）。它在 **构建时** 写入客户端代码（Docker 通过 `--build-arg`），留空则不加载 GA。埋点清单、GA 后台配置与验证方法见 [`docs/analytics.md`](docs/analytics.md)。
- `WECHAT_SHARE_ENABLED`：默认 `false`；公众号渠道验证通过后才设为 `true`，开启微信 JS-SDK 分享。
- 公开客服邮箱在 `src/lib/site.ts` 的 `site.supportEmail` 配置，当前为 `lakehu0x@gmail.com`；帮助、协议和隐私页共用此值。

## 部署（自托管 Docker + Postgres）

```bash
APP_URL=https://your-domain.com docker compose up -d --build
```

`docker-compose.yml` 会启动 Postgres、执行一次迁移（`migrate` 服务），再以 Next.js standalone 模式启动应用；`/api/health` 用作健康检查。应用容器还会读取 `.env`（可选），英文站支付等其余变量写在其中即可。反向代理需转发 `X-Forwarded-For`（H5 支付需要真实客户端 IP）并启用 HTTPS。

订单找回每个来源在 15 分钟内最多尝试 10 次，计数保存在 Postgres，重启应用不会重置。入口代理必须覆盖 `X-Forwarded-For` 或在末尾追加可信来源地址，并阻止绕过代理直连应用；找回接口使用该头的最后一项，缺失时使用 `X-Real-IP`，无法识别的来源共用限流。迁移 `0001_concerned_lucky_pierre.sql` 创建此限流表，需在启用找回功能前应用。

多版本上线前应用 `0002_oval_dagger.sql`，为结果补充问卷 ID、题数、题目 ID 答案、计分和报告版本。既有记录默认归入 `legacy32-v1`，保留原始分数、结果链接和付费权益；历史答案在检查时按冻结的旧题序还原。

## 接入微信支付

1. 在商户平台获取 `mchid`、API 证书序列号、商户私钥（PEM）、APIv3 密钥；开通微信支付公钥或使用平台证书（留空 `WECHAT_PAY_PUBLIC_KEY*` 时系统自动拉取并缓存平台证书）。
2. 关联的公众号 / 服务号 appid 填入 `WECHAT_PAY_APPID`；配置公众号网页授权域名与 JS 接口安全域名为站点域名；`WECHAT_MP_APPID` / `WECHAT_MP_SECRET` 用于 `snsapi_base` 获取 openid 与分享卡片。
3. 商户平台开通 JSAPI（微信内）、H5（手机浏览器）、Native（PC 扫码）三种支付方式。
4. 设置 `PAYMENT_PROVIDER=wechat`（只影响中文订单），重启。回调地址为 `${APP_URL}/api/payments/wechat/notify`。
5. 用小额真实订单验收：微信内 JSAPI、手机浏览器 H5 回跳 `/pay/[orderId]`、PC 扫码轮询。

## 数据与限制

- 没有注册账号体系。访客由一年期的签名 httpOnly cookie 识别；“我的报告”按时间倒序列出该访客全部测试，不依赖 localStorage。未解锁的记录可查看测试结果，已解锁的记录可进入完整报告。
- 清除 cookie 或换浏览器后，输入该访客任意一个完整网站订单号即可恢复身份并展示全部记录；订单可为未支付、已支付等任意状态，恢复身份不会更改支付权限。微信账单应使用商户单号，非微信交易单号。新订单采用 88 位随机部分，并兼容已有订单号；完整订单号是持有即可使用的凭据，只在归属访客的列表、订单页和支付成功页展示，请勿公开。
- 作答进度按版本、题目 ID 和确定题序保存在 localStorage。旧 `mirror.quiz.v1` 草稿自动迁移；新版各版本草稿独立保存。存储失败时使用页面内存继续作答，并提示刷新或关闭会丢失未提交进度。完成后只清除本版本草稿。
- 提交后由服务端计分并持久化。前端的 `unlocked` 仅用于展示，报告页在服务端按已支付订单校验；答案检查生成新记录，原记录与已购报告保留。
- 每份完成的问卷都给出四个字母：没有 `UNCLEAR_RESULT`，也不会因为接近均衡而扣下类型或拒绝订单。某一维度恰好 50% 时归入 I / N / F / P（MBTI 公开惯例），计分版本因此为 `preference-v2`。倾向强弱由 `clarityOf` 按维度分数分四档展示：`even`（50–55）、`balanced`（56–60）、`slight`（61–74）、`marked`（75+），前两档合起来正是数据库中的 `balanced` 标记。四维都接近均衡时，类型只作参考对照，换用全均衡的说明；部分维度接近均衡时保留该类型自己的文案，每个维度的解读、雷达轴与数值都标注清晰度。近均衡维度同时解释两端。这些区间是产品解释规则，并非统计置信区间。连续大量选择同一选项时，结果页只邀请复查答案，不影响结果、类型或解锁。历史已购报告始终可以阅读。`preference-v1` 旧记录保留当时存储的四个字母（旧规则下恰好 50% 归入 E / S / T / J），不重新计分。
- 测试结果（免费）包含四维解释和一条练习；完整报告按偏好强弱、近均衡状态提供场景解读、沟通例句、工作安排及七天实践。四章与两组洞察继续在服务端 HTML 中输出。
- 单人的相处说明书免费分享，公开页只读取不可变的公开快照，不含结果 ID、分数或订单。双人指南（`paid-pair-v2`）要求双方都已解锁各自所用的结果；付款不能代替任何一方的同意，任一方撤回后指南失效。指南只给沟通提示，不给关系评分。
- `src/lib/questionnaires.ts` 定义冻结的 `legacy32-v1` 和 `standard64-v1`，每维分别 8/16 题、正反向各半；英文问卷 `en32-v1` / `en64-v1` 与二者逐题对应（维度与反向计分相同，只有文字不同）。新增或换题需新版本，不能原地改题 ID 或题序。计分版本为 `preference-v2`，报告内容版本为 `context-v2`。
- 题目为独立原创的体验问卷，并非官方 MBTI 量表，两个版本均未经过心理测量学验证。64 题覆盖更多场景，不保证更准确；预计时间需用真实试测校正。96 题和同题数 A/B 版本按审查建议暂缓，等待理解访谈与试测。

## 目录

```
src/app          页面路由（[lang] 下）、API、SEO 文件（robots/sitemap/manifest/OG/llms）
src/proxy.ts     签发访客 cookie；把不带前缀的地址重写到英文页面
src/components   site（页头/更多菜单/手机底栏/弹层）、brand、quiz、result、report、payment、share、pairing、compare、types、ui（shadcn）
src/lib          i18n（语言与文案）、questionnaires（版本/题目）、personality（计分）、preference-content、report-content、compare-content、quiz-progress、site、seo、llms、session、results、orders、shares、comparisons、payments/*（mock / wechat / waffo / crypto）、og/*
src/db           Drizzle schema、连接、迁移脚本
drizzle          SQL 迁移
docs             设计证据截图、品牌说明、埋点文档、方案与验收记录
tests            unit（Vitest）、e2e（Playwright）
```
