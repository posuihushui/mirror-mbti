# 数据埋点（GA4）

本站使用 Google Analytics 4（gtag.js）做用户行为与产品分析。代码在 `src/lib/analytics/`，事件与参数的类型定义在 `events.ts`；本文档与之保持一致。

## 工作方式

| 环节 | 位置 | 说明 |
| --- | --- | --- |
| 初始化 | `src/instrumentation-client.ts` → `initAnalytics()` | 在 hydration 之前建立 `dataLayer` 队列，写入 consent 默认值与 `config`，发送首个 `page_view`。gtag.js 在 `load` 事件之后才加载，不占用首屏。 |
| 页面浏览 | `components/analytics/page-views.tsx` | 客户端路由切换后按 **pathname** 发送 `page_view`；`?chapter=`、`?unlock=1` 这类参数变化不算新页面。GA 自带的 `send_page_view` 已关闭。 |
| 服务端页面曝光 | `components/analytics/track-view.tsx` | Server Component 中放 `<TrackView event=… />`，挂载时发送一次，`router.refresh()` 不会重复发送。 |
| 链接与按钮点击 | `trackAttrs(cta, location)` + 全局委托监听 | 元素上渲染 `data-track`、`data-track-location`，点击时发送 `cta_click`。Server Component 无需改成客户端组件。已展开的折叠面板再次点击（收起）不计。 |
| 业务事件 | `track(name, params)` | 客户端组件中直接调用，事件名与参数有类型检查。 |
| 购买 | `trackPurchase(order)` | 支付弹层、加密货币结账、`/pay/[orderId]` 都可能最先发现支付成功，统一走这里；本地记录去重，并附带 `transaction_id` 供 GA 去重。 |

所有事件自动附带：

- `page_type`：`home` `quiz` `result` `result_sample` `report` `report_sample` `pay` `my_report` `types` `type_detail` `preferences` `about` `help` `privacy` `terms` `other`
- `site_language`：`zh` / `en`

用户属性：`wechat_browser`（是否在微信内置浏览器中打开）。

布尔参数一律以字符串 `"true"` / `"false"` 发送。

## 隐私约束（不可放宽）

- **网址脱敏**：`page_location` / `page_referrer` 经过 `sanitizeLocation` / `sanitizeReferrer`。`/result/<id>` → `/result/[id]`，`/report/<id>` → `/report/[id]`，`/pay/<订单号>` → `/pay/[orderId]`，其他位置出现的订单号也会被替换。查询参数只保留 `utm_*`、`gclid`、`gbraid`、`wbraid` 与微信分享附加的 `from`。
- **订单号是找回凭据**，永远不发送。`purchase.transaction_id` 是订单号的 SHA-256 截断摘要，不可还原。
- **不发送**：作答、分数、人格类型、订单号、微信 openid、钱包地址、链上交易哈希。隐私政策承诺不向第三方共享作答与结果。
- 广告相关 consent 默认 `denied`，Google 信号与广告个性化关闭。
- 新增事件或参数若改变了发送的数据类别，需同步更新 `/privacy` 中英文页面。

## 配置与上线

1. 在 GA 中创建 GA4 媒体资源和 Web 数据流，获得衡量 ID（`G-XXXXXXX`）。
2. **构建时**注入：`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX npm run build`；Docker 使用 `--build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=…`（`docker-compose.yml` 已透传）。只修改运行时环境变量不会生效。留空则不加载 GA，事件只进入页面内的 `window.dataLayer`。
3. 数据流 → 增强型衡量：
   - **关闭**「基于浏览器历史记录事件的网页更改」。页面浏览由代码手动发送，保留会重复计数。
   - **关闭**「出站点击」。钱包深链中含有结果页地址；需要的外链点击已单独埋点（`crypto_wallet_link`、`crypto_wallet_open`）。
   - 建议关闭「表单互动」，找回表单已有 `recover_*` 事件。
   - 「滚动」可保留，用于观察阅读深度。
4. 管理 → 自定义定义：注册下表中的参数。未注册的参数不会出现在标准报告中，但 DebugView 和 BigQuery 导出中仍然可见。
5. 管理 → 事件：将 `quiz_complete`、`begin_checkout`、`purchase` 标记为关键事件（可选 `quiz_start`）。
6. 管理 → 数据保留：改为 14 个月。
7. 演示支付（`PAYMENT_PROVIDER=mock` / `EN_PAYMENT_PROVIDER=mock`）也会发送 `purchase`，参数为 `payment_mode=mock`。分析收入时按 `payment_mode` 排除，或只在真实支付环境中配置衡量 ID。

### 需要注册的自定义定义

| 类型 | 参数 |
| --- | --- |
| 事件范围维度 | `page_type` `site_language` `cta_id` `cta_location` `questionnaire_id` `progress_percent` `resumed` `is_sample` `result_owner` `result_clear` `result_unlocked` `chapter_number` `nav_method` `tab` `payment_mode` `payment_type` `stage` `error_code` `target` `completed` `order_status` `outcome` `copy_target` `network` `token_symbol` `wallet_name` `language_to` `faq_index` `question_number` |
| 事件范围指标 | `question_count` `answered_count` `record_count` `unlocked_count` |
| 用户范围维度 | `wechat_browser` |

`currency`、`value`、`items`、`transaction_id` 是 GA4 电商内置参数，无需注册。

## 中国大陆可访问性（重要）

`www.googletagmanager.com` 与 GA 的数据收集域名在中国大陆通常无法直连。在微信内打开的大陆用户大多加载不到 gtag.js，事件会停留在页面队列中而不会上报，中文站的数据会明显偏少。上线前请评估：

- 使用 [Google tag gateway](https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide) 等第一方代理，经自有域名转发（转发端需要能访问 Google）；或
- 为中文站增加国内可用的统计服务（如百度统计、自托管 Umami）。`track()` 是唯一出口，在其中增加一个发送端即可复用全部事件，调用点无需改动。

英文站与境外访问不受影响。

## 验证

- **本地**：打开页面，在浏览器控制台运行：

  ```js
  dataLayer.map((c) => Array.from(c)).filter((c) => c[0] === "event")
  ```

- **GA DebugView**：在任意页面地址后加 `?ga_debug=1`，当前标签页内持续开启（`?ga_debug=0` 关闭），微信内也可使用；然后在 GA「管理 → DebugView」中查看实时事件。
- **自动化测试**：`tests/unit/analytics.test.ts` 覆盖网址脱敏、进度节点与金额换算；`tests/e2e/analytics.spec.ts` 从首页走到付费阅读，断言事件与参数，并确认 `dataLayer` 中不含结果编号与订单号。

## 常用分析

| 问题 | 做法 |
| --- | --- |
| 主转化漏斗 | 漏斗探索：`page_view`(home) → `cta_click`(start_quiz / resume_quiz) → `quiz_start` → `quiz_progress`(25/50/75/100) → `quiz_complete` → `result_view`(result_owner=true) → `begin_checkout` → `add_payment_info` → `purchase` → `report_view` |
| 答题在哪里流失 | `quiz_progress` 按 `questionnaire_id` × `progress_percent` 统计用户数，对比 32 题与 64 题版本 |
| 版本选择 | `quiz_start` 按 `questionnaire_id`、`resumed`；`quiz_version_switch` 次数 |
| 哪个入口带来测试 | `cta_click` 按 `cta_id` × `cta_location` × `page_type` |
| 示例是否带来测试 | `page_view`(result_sample / report_sample) 之后的 `cta_click`(start_quiz) |
| 支付为什么失败 | `payment_error` 按 `error_code` × `payment_type`；`payment_cancel` 按 `stage`；`checkout_close`(completed=false) |
| 微信内外差异 | 以用户属性 `wechat_browser` 细分上述漏斗 |
| 报告读到哪一章 | `report_chapter_view` 按 `chapter_number`、`nav_method`；`report_tab_switch` |
| 分享回流 | `page_view` 的 `page_location` 含 `from=singlemessage` / `groupmessage` / `timeline` |
| 找回记录 | `recover_submit` → `recover_success` / `recover_error`(error_code) |
| 断链 | `page_not_found` 按 `page_referrer` |

## 事件字典

### 站点

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `page_view` | 首次加载与每次路径变化 | `page_location` `page_referrer`（均已脱敏） |
| `cta_click` | 点击带 `trackAttrs` 的链接或按钮 | `cta_id` `cta_location` |
| `language_menu_open` | 打开语言菜单 | `cta_location`（header_nav / header_mobile） |
| `more_menu_open` | 打开顶栏「更多信息」菜单 | `cta_location`（header_nav / header_mobile） |
| `language_switch` | 选择另一种语言 | `language_to` |
| `faq_open` | 「关于这次探索」弹层中展开问题 | `faq_index`（从 1 开始） `cta_location` |
| `page_not_found` | 404 页面 | — |

### 测试

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `quiz_start` | 在版本页选择开始或继续某个版本 | `questionnaire_id` `question_count` `resumed` `answered_count` |
| `quiz_progress` | 答题数首次达到 25% / 50% / 75% / 100% | `questionnaire_id` `question_count` `progress_percent` `answered_count` |
| `quiz_version_switch` | 答题中点击「切换版本」 | `questionnaire_id` `question_count` `answered_count` |
| `quiz_review_open` | 展开答题回顾 | `questionnaire_id` `question_count` `answered_count` |
| `quiz_review_jump` | 在回顾中跳到另一题 | `questionnaire_id` `question_count` `question_number` |
| `quiz_restart` | 确认重新开始 | `questionnaire_id` `question_count` `answered_count` |
| `quiz_incomplete` | 提交时仍有未答题目，跳回该题 | `questionnaire_id` `question_count` `question_number` |
| `quiz_submit` | 点击查看结果 | `questionnaire_id` `question_count` |
| `quiz_complete` | 结果创建成功 | `questionnaire_id` `question_count` |
| `quiz_submit_error` | 结果创建失败 | `questionnaire_id` `question_count` `error_code` |
| `quiz_storage_unavailable` | 浏览器存储不可用，进度只保存在内存中 | `questionnaire_id` `question_count` |

### 结果、报告与记录

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `result_view` | 结果页（含示例） | `questionnaire_id` `question_count` `is_sample` `result_owner` `result_clear` `result_unlocked` |
| `view_item` | 本人、倾向明确且未解锁的结果页 | `currency` `value` `items` |
| `result_answers_review` | 倾向不明确时点击回看作答 | `outcome`（loaded / failed） |
| `report_view` | 报告页（含示例） | `questionnaire_id` `question_count` `is_sample` |
| `report_chapter_view` | 切换到另一章 | `chapter_number` `nav_method`（tab / sidebar / next） |
| `report_tab_switch` | 第二章「优势 / 容易忽略的」切换 | `tab`（strengths / blindspots） |
| `my_report_view` | 「我的报告」页 | `record_count` `unlocked_count` |
| `recover_submit` / `recover_success` / `recover_error` | 用订单号找回记录 | `recover_error`：`error_code` |

### 结账（GA4 推荐电商事件）

商品固定为 `items: [{ item_id: "full_report", item_name: "Full report", item_category: "report", price, quantity: 1 }]`，`value` 以元或美元计。

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `begin_checkout` | 支付弹层打开（解锁按钮或 `?unlock=1` 链接） | 电商参数、`payment_mode` |
| `add_payment_info` | 订单创建成功 | 电商参数、`payment_mode` `payment_type` |
| `purchase` | 首次观察到订单已支付 | 电商参数、`payment_mode` `payment_type` `transaction_id` |
| `payment_cancel` | 点击「暂不支付」，或在微信收银台内取消 | `payment_mode` `stage`（before_order / processing / wechat_jsapi） |
| `payment_error` | 创建订单失败、订单关闭或过期、微信支付调起失败 | `payment_mode` `error_code` |
| `payment_redirect` | 跳转微信网页授权、H5 收银台，或 Waffo 银行卡收银台 | `payment_mode` `target`（wechat_oauth / wechat_h5 / waffo_checkout） |
| `checkout_close` | 关闭支付弹层 | `payment_mode` `completed` |
| `pay_status_view` | 订单页 `/pay/[orderId]` | `payment_mode` `order_status` |
| `copy_to_clipboard` | 复制订单号或收款地址 | `copy_target` `outcome` |

- `payment_type`：`mock`、`wechat_jsapi`、`wechat_h5`、`wechat_native`、`crypto_ethereum`、`crypto_solana`、`waffo_card`。
- `error_code`：接口错误码（如 `UNCLEAR_RESULT`、`ORDER_FAILED`）；订单状态 `ORDER_EXPIRED` / `ORDER_CANCELLED` / `ORDER_FAILED`；`NO_WEIXIN_BRIDGE`、`JSAPI_FAIL`、`NO_PAYLOAD`、`UNSUPPORTED_PAYLOAD`；网络异常时为错误名（如 `TypeError`）。
- `/pay/[orderId]` 只在本页观察到订单由待支付变为已支付，或支付时间在 30 分钟以内（H5 支付回跳）时发送 `purchase`，避免日后回访旧订单被重复计入。

### 加密货币结账（英文站）

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `crypto_network_select` | 选择网络 | `network` |
| `crypto_token_select` | 切换 USDC / USDT | `network` `token_symbol` |
| `crypto_wallet_connect` | 连接钱包的结果 | `wallet_name` `outcome`（connected / signed / wrong_wallet / rejected / failed） |
| `crypto_transfer_submit` | 发起转账的结果 | `token_symbol` `outcome`（sent / rejected / failed） |
| `crypto_wallet_open` | 打开 Solana Pay 钱包链接 | `network` `token_symbol` |
| `crypto_wallet_link` | 手机无注入钱包时点击钱包 App 深链 | `wallet_name` |
| `crypto_order_expired` | 订单超过 30 分钟未支付 | `network` |

### `cta_id` 与 `cta_location`

| `cta_id` | 含义 |
| --- | --- |
| `start_quiz` / `resume_quiz` / `retake_quiz` | 开始测试 / 继续未完成的测试 / 重新测试 |
| `view_sample_result` / `read_sample_report` | 查看示例结果 / 阅读示例报告 |
| `unlock_report` / `read_report` / `view_result` | 解锁完整报告 / 阅读完整报告 / 查看简要结果 |
| `review_answers` | 回看作答（倾向不明确） |
| `retry_payment` / `back_to_result` | 订单页：重新支付 / 返回结果 |
| `my_report` | 我的报告 |
| `open_about` | 打开「关于这次探索」弹层（首页桌面步骤条） |
| `view_about` `view_help` `view_preferences` `view_types` `view_type` `view_privacy` `view_terms` | 站内内容页链接 |
| `contact_email` | 帮助页的客服邮箱 |
| `order_receipt` / `recover_other` | 展开订单号 / 展开「找回其他记录」 |
| `home` | 回到首页（报告结尾、404） |

`cta_location`：`header_nav`（桌面导航及其「更多信息」菜单）、`header_mobile`（手机顶栏及其「更多」菜单）、`hero`（首页首屏）、`dock`（手机底部固定栏）、`steps_bar`、`page_cta`（页面主体按钮）、`sample_cta`、`sample_notice`、`unlock_panel`、`result_panel`（桌面解锁区按钮）、`unclear_result`、`history_item`、`payment_sheet`、`payment_success`、`pay_status`、`report_closing`、`about_overlay`、`empty_overlay`、`type_grid`、`type_context`。

## 新增埋点

1. 在 `src/lib/analytics/events.ts` 的 `AnalyticsEvents` 中声明事件与参数，或为 `CtaId` / `CtaLocation` 增加取值。
2. Server Component 中的链接或按钮使用 `{...trackAttrs(cta, location)}`；客户端组件调用 `track()`；页面曝光使用 `<TrackView>`。
3. 更新本文档；需要在报表中使用的参数，到 GA 注册自定义定义。
4. 确认没有发送编号、作答或结果；数据类别有变化时更新隐私政策。

## 分享与双人提示

`/s/[token]`、`/t/[token]`（含确认页）、`/compare/[id]`及`/my/shares`的页面路径经过占位符替换，去除全部查询参数，覆盖`/en`与内部`/zh`。这些页面不加载gtag；已加载时设置measurement-id对应的`ga-disable`，链接点击捕获阶段即关闭，避免增强型下载/外链/导航自动采集完整能力链接。自有事件只POST到`/api/share-events`，不发GA。

分享来源以自有数据库的7日首次触达/首次完成为准。复用现有版本选择按钮的一次`quiz_start`触发点，同时发送不含token的`share_quiz_started`，不新增GA初始化或重复GA事件。复制与保存请求只表示操作，不能称为真实分享成功。聚合与保留期命令见`docs/verification/share-growth.md`。
