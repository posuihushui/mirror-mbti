# 观己管理后台（本地）

这是npm workspace 中的独立 Next.js 应用，默认在 <http://localhost:3001> 运行；主站仍在 3000。后台只读查看业务数据，登录限流与 Telegram 队列使用独立表。不需要域名。

## 启动

在仓库根目录运行：

```bash
npm ci
npm run db:migrate
cp apps/admin/.env.example apps/admin/.env.local
npm run admin:password
```

编辑 `apps/admin/.env.local`：`ADMIN_DATABASE_URL` 指向主站同一数据库；填入生成的 `ADMIN_PASSWORD_HASH`、管理员账号和独立的 `ADMIN_SESSION_SECRET`（至少 32 个随机字符，可用 `openssl rand -base64 32` 生成）。默认 `ADMIN_URL=http://localhost:3001`，浏览器请使用同一地址，不要换成 127.0.0.1。

```bash
npm run admin:dev
```

打开 <http://localhost:3001> 登录。生产构建与本地启动：`npm run admin:build`、`npm run admin:start`。所有依赖由根目录 `package-lock.json` 与 `npm ci` 提供，无需在子目录再次安装。

- 经营概览：PV、浏览器 UV、完成测试、新建订单、按支付时间统计的已支付金额。
- 订单：日期、状态、渠道、商品、语言、精确订单号筛选；50 条一页；输出订单号脱敏。
- 浏览：每日趋势、热门页面、来源域名、粗粒度设备分类、最近浏览记录。
- 匿名访客：期间活跃浏览器、累计测试和订单数量、单个浏览器的浏览时间线；不展示作答、分数或人格类型。

所有时间均按北京时间，开始与结束日期包含当天，最长查询 90 天。PV/UV 从新增采集上线开始，没有 GA 历史回填。UV 是浏览器数，清 Cookie 或换设备会产生新标识。客户端采集可能被拦截、丢包或伪造，不是审计日志；来源只保存域名，站内跳转会显示本站域名。访客列表的测试/订单数为累计，不是期间转化率。

人民币与美元分开，完整报告与「请 TA」分开，模拟订单单列。收入面板只统计当前仍为 paid 的真实订单，并以 paid_at 落在期间为准；不代表税后结算净额或退款流水。

## Telegram 查询与推送

通过 [BotFather](https://t.me/BotFather) 创建专用机器人，在 Telegram 中先给机器人发送 `/start`。在 `.env.local` 设置：

```dotenv
TELEGRAM_BOT_TOKEN=你的机器人Token
TELEGRAM_ADMIN_CHAT_ID=你的私聊数字ID
TELEGRAM_ALLOWED_USER_IDS=
TELEGRAM_INCLUDE_MOCK=false
```

可以用 Telegram 官方 `getUpdates` 查看给机器人发送的消息中的 `message.chat.id` / `message.from.id`。不要把带 Token 的 API URL、Token 或配置文件提交到仓库或转发给别人。私聊默认只允许 chat_id 同名的发送账号；如果用群聊，必须另填逗号分隔的 `TELEGRAM_ALLOWED_USER_IDS`，群内所有成员都可能看到查询回复及通知，因此推荐私聊。

在仓库根目录另开终端：

```bash
npm run admin:telegram
```

机器人采用 [Telegram 官方长轮询接口](https://core.telegram.org/bots/api#getupdates)，无需公网域名、入站端口或 Webhook。使用相同数据库的一次只运行一个进程，已有 Webhook 时会拒绝启动，不会擅自删除它。电脑休眠或进程退出时不能即时回复；订单通知已入库，重启后继续发送。

命令：`/summary` 今日经营概览、`/orders` 最近 10 笔订单、`/traffic` 今日 PV/UV 与热门页面、`/help` 说明。查询只对允许的账号开放，忽略超过 5 分钟的旧命令。消息发送启用 `protect_content`，关闭链接预览，不含完整订单号、访客或结果编号、答案、分数、私人链接；完整订单号是恢复凭据，绝不能推送。

订单创建和实际状态变化由数据库触发器在同一事务写入 `telegram_outbox`，覆盖应用、支付回调、轮询及取消/过期路径，不依赖浏览器事件。迁移前的旧订单不会补发，但之后发生的状态变化会入队；迁移后而机器人启动前的消息会保留。默认只推送真实渠道；如本地用 mock 验证，设置 `TELEGRAM_INCLUDE_MOCK=true`，消息会清楚标记不计入收入。失败采用退避并遵循 `retry_after`，成功后标记已发送。一次订单同一状态只有一条队列记录；网络超时或成功后进程崩溃可能造成重发，属于至少一次投递。

## 数据库权限与维护

可以先用现有本地数据库账号验证。长期使用时建立单独角色：只允许 SELECT `visitors`、`results`、`orders`、`browser_events`；允许 SELECT/INSERT/UPDATE `admin_login_attempts`、`telegram_state`；允许 SELECT/UPDATE `telegram_outbox`。后台与机器人不需要修改订单、测试或报告的权限。应用的业务查询还会使用数据库只读事务。机器人队列触发器由主站订单的写入角色执行，需要对 `telegram_outbox` INSERT 与 sequence USAGE 权限；数据库迁移由迁移角色执行。不得把管理员连接串放进 `NEXT_PUBLIC_*`。

浏览记录、已发送通知按 90 天保留，维护账号单独执行清理；未发送通知不会被删除。请按日运行以下命令，默认只显示待清理数量，`--apply` 才删除：

```bash
ADMIN_MAINTENANCE_DATABASE_URL=postgres://... npm run db:cleanup:admin
ADMIN_MAINTENANCE_DATABASE_URL=postgres://... npm run db:cleanup:admin -- --apply
```

管理员登录：scrypt 密码摘要、8 小时签名 HttpOnly 会话、独立会话密钥、同源写入保护、数据库原子限流（所有进程合计 30 次/15 分钟）。不配置凭据不会开放查询；修改密码摘要或会话密钥使所有旧会话失效。后台禁止索引、嵌入和浏览器缓存。默认本地启动仅绑定 localhost；如以后公开访问，应使用 HTTPS、独立后台域名和专用数据库角色。

## 验证

```bash
npm run admin:typecheck
npm run typecheck
npm run lint
npm test
npm run admin:build
ADMIN_TEST_DATABASE_URL=postgres://... npx vitest run --config vitest.admin-integration.config.mts
```

集成测试必须指向已迁移的隔离测试库，会创建并删除自己生成的测试数据。Telegram API 使用模拟响应验证授权、Token 脱敏和重试；真实收发需要你配置 Token、账号 ID 并运行机器人。

2026-10-08 monorepo 验证：两个应用生产构建、全工作区类型检查与 ESLint、319 项单元测试、38 项主站数据库测试和 5 项后台数据库测试通过。新建隔离库完成全部迁移，生成工具确认没有表结构变化。两个生产包复制到仓库外后，主站、后台登录查询及报告 PNG 均正常。

浏览器全回归为 193 通过 / 6 跳过 / 3 失败。其中两个邀请链接失败由本地监听地址引起，改为 localhost 后手机和电脑复测均通过。剩余一项为既有桌面首页截图基线差异，没有更新基线或页面。真实 Telegram 收发仍需配置凭据。Docker 配置已更新，本机未安装 Docker，未执行容器构建。
