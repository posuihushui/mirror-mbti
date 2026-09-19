# 英文站银行卡收款：法币路径调研（2026-09-17）

前一篇《[加密/卡收款方案调研](./en-card-payment-research.md)》的结论之一是"收美元 ≠ 需要外币卡"。本篇把这条路查实：
**哪些平台能让一个没有公司、没有海外银行账户的大陆个人，收 Visa/Mastercard，然后把钱打到自己的支付宝或国内银行卡。**

结论：**能，而且有两家把这件事写进了官方文档** —— Creem 和 Waffo Pancake。这条路不需要碰加密货币。

> **实现状态（2026-09-17）**：已按本文结论接入 **Waffo Pancake**，英文报告定价改为 **$6.9**（`PRICE_USD_CENTS=690`）。
> 代码见 `src/lib/payments/waffo/` 与 `/api/payments/waffo/webhook`，开关是 `EN_PAYMENT_PROVIDER=waffo`。
> 按你的决定**不做退款功能**：退款事件只记账、不回收报告，支付弹层、条款与隐私政策都提前写明"购买后不支持退款"。
> 还没做的是你自己要跑的部分：注册实名、建店铺与商品、把 5 个 `WAFFO_*` 环境变量填上、在控制台把 webhook 指到 `${APP_URL}/api/payments/waffo/webhook`。

---

## 0. 一句话结论

| 路径 | 能不能跑通 | 建议 |
| --- | --- | --- |
| **Waffo Pancake**（MoR，3.9% + $0.50） | ✅ 官方文档写明：**仅支持中国大陆、人民币结算**，打款到**支付宝或银行卡** | **首选**。个人身份注册，产品形态（hosted checkout + webhook + TS SDK + test 环境）和本仓库现有抽象完全对得上 |
| **Creem**（MoR，3.9% + $0.40） | ✅ 官方文档写明：**China 个人收款人 → 支付宝**（企业 → 本地银行账户） | **并列首选/备份**。费率略低、平台更成熟，但打款是每月 1/15 号两次 |
| **Paddle / Dodo Payments + Payoneer** | ✅ 可行，但绕一道 | 备选。Paddle 5% + $0.50、月付一次、门槛 $100；Payoneer 提现到国内卡约 1.2% |
| **Lemon Squeezy** | ⚠️ 大陆不在银行打款国家名单里，只能走 PayPal | 不推荐 |
| **PayPal 直收** | ⚠️ 可收卡，但大陆提现电汇 $35/笔，或经连连 1.2% | 只适合当补充支付方式 |
| **国内跨境收单**（Oceanpayment / Airwallex / 连连） | ❌ 现阶段不合适 | 要营业执照，常见开户费、T+10~15 结算、10% 滚动保证金；等月流水上万美元再说 |

**定价前提不变**：$1 的英文报告在任何卡通道下都不成立（固定费就吃掉 5%~50%）。先把 `PRICE_USD_CENTS` 提到 **$5~$9**。

---

## 1. Waffo Pancake（waffo.ai）

官方事实（均出自 docs.waffo.ai / waffo.ai）：

- **模式**：MoR（法定销售方），"个人身份即可收款"，无需注册公司。
- **费率**：卡 / Apple Pay / Google Pay **3.9% + $0.50**；微信支付 **3.9%（无固定费）**；无开户费、无月费。
- **定价货币**：USD、EUR、GBP、JPY、HKD 五种；覆盖 173 个国家。
- **结算**："目前仅支持中国大陆，以人民币结算"，提现账户支持 **银行卡** 或 **支付宝**。
- **提现**：最低 **> $10**，**费率 1%、最低 $10/笔**，到账 **1–3 个工作日**，按提交时汇率折人民币。
- **资金冻结**：销售款约 **10 个工作日** 后才进入可提现余额（用于退款/拒付窗口）。
- **支付宝限额**：单笔 **RMB 50,000**，年度累计 **RMB 300,000**。
- **实名**：先完成身份验证，收款人姓名自动取自实名信息、不可手改，首次打款会做一致性校验。
- **其他费用**：3DS 验证失败 **$0.30/次**、验证通过但授权失败 **$0.30/次**、退款手续费 **$1.00/次且原交易费不退**。
- **集成**：hosted checkout（`checkout.createSession` → `checkoutUrl`）、REST + GraphQL、Webhooks、官方 TypeScript SDK（`@waffo/pancake-ts`，内置签名与 webhook 验签）、带 `X-Environment: test` 的测试环境。

⚠️ **注意**：`1% 最低 $10` 的提现费对小额很不友好 —— 提 $200 实际是 5%。**攒到 ≥ $1,000 再提**才接近 1%。

⚠️ **平台风险**：Waffo 是 2026 年的新平台，资金在提现前由它托管。建议开局阶段定期提现，不要留大额余额。

## 2. Creem（creem.io）

- **费率**：**3.9% + $0.40**，但注意平台费按**订单总额（含税）**计 —— 官方例子：$20 商品 + 20% VAT = $24，平台费 = 3.9% × $24 + $0.40 = $1.33。
- **中国打款**（官方 Payouts 文档原文）：
  - 个人收款人 → **支付宝**，单笔上限 **50,000 CNY**，年度 **300,000–600,000 CNY**
  - 企业收款人 → **本地银行账户**，无限额
- **打款费**：$7 或 1%，取高者。
- **周期**：每月 **1 号和 15 号**两次，最低余额 **$50** 才能点提现；另有 **7–12 天风控冻结**（15 号打款只结算本月 8 号前的交易）。
- **实名一致**：以个人身份 onboard，收款账户必须是同名个人账户。
- **国家**：China 在支持的 86 个商户国家表内（带单星号，指向限额说明）。
- **额外费用**：拒付 $25/次；分账 2%、联盟营销 2%、弃单挽回 5%（都用不上）。

## 3. Paddle / Dodo Payments + Payoneer

- **Paddle**：5% + $0.50；中国**不在**其不支持国家名单内（该名单是阿富汗/古巴/伊朗/朝鲜/俄罗斯等 28 个国家/地区）；打款方式为 **电汇或 Payoneer**，每月 1 号发起、15 号前送出，**门槛 $100**（可调到 $100,000），部分国家电汇收 **$15 SWIFT 费**，走 Payoneer 可绕开。
- **Dodo Payments**：官方文档把 **Payoneer 账户当作普通银行账户**支持，最低打款 $50、默认每月两次；但文档没写明大陆商户支持情况，需要发邮件问 support。
- **Payoneer 提现到国内**：按银行实时汇率结汇，费率约 **1.2%**，单笔 $500–$30,000，几小时到账；通行说法是走持牌机构直接人民币入账，不占用个人年度 5 万美元便利化额度（**这是行业口径，不是监管书面结论，自己掂量**）。
- **代价**：Paddle 对独立开发者的入驻审核偏严（要看真实网站与商业实质），且它是"月结 + $100 门槛"，现金流最慢。

## 4. 不推荐的两条

- **Lemon Squeezy**：银行打款覆盖 79 国，**大陆不在其中**；只能走 PayPal payout，再从 PayPal 提现（电汇 $35/笔，或经连连 1.2%），多一层损耗和风控。
- **国内跨境收单**（Oceanpayment 钱海 / Airwallex / 连连 / PingPong）：面向有执照的商家，独立站信用卡通道常见开户费、T+10~15 结算、10% 保证金冻结 180 天。PingPong 主要服务平台卖家，不能直接收 Visa/Mastercard。以本项目当前体量，这条完全不划算。

---

## 5. 成本对照（英文报告定价 $9，不含 VAT 口径）

单笔：

| 平台 | 单笔手续费 | 单笔净收 |
| --- | --- | --- |
| Creem | $0.751 | **$8.25** |
| Waffo Pancake | $0.851 | **$8.15** |
| Dodo（约 4% + $0.40） | ~$0.76 | ~$8.24 |
| Paddle / Lemon Squeezy | $0.95 | **$8.05** |

月流水 $1,000（约 111 单）算到手：

| 路径 | 平台费后 | 提现层 | 最终到手 | 综合成本 |
| --- | --- | --- | --- | --- |
| Creem → 支付宝 | $916.6 | 1%（$9.17） | **≈ $907** | 9.3% |
| Waffo → 支付宝/银行卡 | $905.5 | max(1%, $10) = $10 | **≈ $896** | 10.4% |
| Paddle → Payoneer → 国内卡 | $894.5 | Payoneer ≈1.2% | **≈ $884** | 11.6% |
| Lemon Squeezy → PayPal → 国内 | $894.5 | $35 电汇或 1.2% | **≈ $870** | 13% |

月流水只有 $200 时，Waffo 的 $10 最低提现费就是 5%，Creem 的 $7 是 3.5% —— **低流水阶段 Creem 更划算，或者干脆攒几个月再提**。

对照现有链上直收：手续费几乎为零，但只覆盖"已经持有 USDC/USDT 且会用钱包"的极少数人。所以正确的组合是 **卡（走量）+ 加密（保留给币圈用户）**，不是二选一。

---

## 6. 硬约束与风险（这条路真正要盯的地方）

1. **支付宝年度限额**：Waffo 30 万 CNY/年，Creem 30–60 万 CNY/年。两家很可能共用同一打款通道。年流水超过这个量级就必须换成公司主体 + 对公账户。
2. **资金冻结期**：Waffo ~10 个工作日，Creem 7–12 天 + 每月只有 2 个打款窗口。**从收款到人民币到账，最坏要 3~4 周**，做现金流预期时要算进去。
3. **小额交易的隐性成本**：Waffo 对 3DS 失败/授权失败收 $0.30/次。低价数字商品是盗卡测试的靶子，一波刷卡失败就是净亏。上线后必须盯失败率，必要时加人机校验或限频。
4. **退款/拒付**：Waffo 退款 $1 且原交易费不退；Creem 拒付 $25/次。$9 的客单价，退一单等于白干两单。
5. **实名一致**：个人身份注册的账户，只能提到**同名**支付宝/银行卡，改不了。
6. **税**：MoR 替你处理的是**买家侧**的 VAT/销售税，不是你的个人所得税。境外所得在境内仍有申报义务，这部分自己找会计确认。
7. **平台集中度**：MoR 模式下钱先到平台再到你。Waffo 是新平台，Creem 规模也不大。别把余额留在平台上。

---

## 7. 接进本仓库要动什么

好消息：Waffo 和 Creem 都是 **hosted checkout + webhook**，和前一篇为 Creem 设计的改造完全一致，**一套 `redirect` provider 抽象两家都能用**，甚至能和现有 crypto 并存。

现状：`payment_provider` = `mock | wechat | crypto`，`payment_channel` = `mock | jsapi | native | h5 | ethereum | solana`，`order_status` 已含 `refunded`。

1. **env**：`EN_PAYMENT_PROVIDER` 增加 `card`（或 `waffo` / `creem`）；新增 `WAFFO_MERCHANT_ID` / `WAFFO_PRIVATE_KEY` / `WAFFO_STORE_SLUG` / `WAFFO_PRODUCT_ID` / `WAFFO_WEBHOOK_SECRET`；`PRICE_USD_CENTS` 提价。`src/lib/env.ts:16` 的 zod enum 同步。
2. **迁移**：`payment_provider` 加 `waffo`（或 `card`），`payment_channel` 加 `card`；`npm run db:generate` 后提交 `drizzle/` SQL。
3. **PaymentPayload 新分支** `{ kind: "redirect"; url: string }`。**不要在站内自建卡表单** —— 那会把 PCI 范围拉到自己身上。新增 `src/components/payment/card-payment.tsx`：一个"去支付"按钮 + 回跳后轮询 `/api/orders/[id]`，复用现有 `pay-status.tsx`。
4. **provider 实现** `src/lib/payments/waffo/`：`createPayment` 调 `checkout.createSession`（`successUrl` 回 `/en/pay/[orderId]`，订单号透传到 `metadata`，保持"`orders.id` 即外部单号"的约定）；`queryPayment` 回查订单；验签逻辑单独放 `crypto.ts` 保持纯函数可单测，与 `wechat/crypto.ts` 同构。SDK 自带 webhook 验签，但仍建议自己实现一份以便单测。
5. **webhook** `src/app/api/payments/waffo/webhook/route.ts`：先 `await connection()`，验签 → 写 `payment_events`（按 provider event id 幂等）→ `markOrderPaid`。
6. **退款事件要单独决策**：`setOrderStatus` 现在只允许从 `created` 迁移，`paid → refunded` 走不通。而 AGENTS.md 写明"永不移除已付报告的访问权"。**建议：收到 refund webhook 时记账（写 `payment_events` + 订单标记），但不回收报告访问**，并在 `/en` 条款里写清"报告一经解锁不因退款回收"。这条要你确认。
7. **隐私政策必须改**：MoR checkout 会收集买家邮箱（开票/税务要求）和 IP，这些数据交给了第三方。按 AGENTS.md 的规矩，"发送的数据变了就要更新隐私政策"。同时 `/en` 的条款要写明"订单由 <平台> 作为 seller of record 处理，发票与退款由其负责"。
8. **结账页**：`/en/pay/[orderId]` 增加 Card / Crypto 选择（provider 存在订单上，所以要在建单时定）。文案全部进 `src/lib/i18n/messages/*`，mock 模式继续显示 "Demo" 标签。
9. **订单 TTL**：hosted checkout 会话通常 30–60 分钟，和现有 crypto 的 30 分钟一致，`ORDER_TTL_MS` 可直接复用。
10. **测试**：webhook 验签单测；e2e 在 mock 模式下覆盖"选卡 → 跳转占位页 → 回跳 → 已付"，不打外部 API。

---

## 8. 建议的下一步

1. **先提价**：把英文报告定到 $5~$9（$9 的通道成本约 10%，$1 是 50%）。
2. **同时注册 Waffo 和 Creem**（都免费、都要实名），**用真实主体跑通各自的 $1 测试单和一次提现**，验证两件事：支付宝到账是否顺畅、实际汇率损耗多少。这一步的实测结果比任何调研都可靠。
3. 谁先跑通用谁，另一家留作备份 —— MoR 是单点依赖，备份账号有价值。
4. 卡通道上线后，**保留现有 USDC/USDT 直收**作为第二选项（成本几乎为零，且已经写好了）。

---

## 参考

- Waffo 定价（3.9% + $0.50，173 国，5 种定价货币）：https://www.waffo.ai/zh/pricing
- Waffo 费用明细（微信 3.9%、3DS 失败 $0.30、退款 $1、提现 1% 最低 $10）：https://docs.waffo.ai/mor/fees
- Waffo 提现流程（>$10、1–3 工作日、~10 工作日冻结、支付宝 5 万/笔 30 万/年）：https://docs.waffo.ai/merchant/payout-flow
- Waffo 提现账户（银行卡 / 支付宝，仅大陆、CNY 结算、实名一致）：https://docs.waffo.ai/merchant/payout-accounts
- Waffo 开发者文档（checkout session / REST / webhook / TS SDK）：https://docs.waffo.ai/zh
- Creem Payouts（China：个人→支付宝 5 万/笔、30–60 万/年；1/15 号；$50 门槛；7–12 天冻结）：https://docs.creem.io/merchant-of-record/finance/payouts
- Creem 支持国家（China 在列）：https://docs.creem.io/merchant-of-record/supported-countries
- Paddle 打款规则（$100 门槛、月结、电汇或 Payoneer、$15 SWIFT）：https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid
- Paddle 不支持国家名单（无中国）：https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle
- Dodo Payments 打款结构（支持 Payoneer 作为银行账户、$50 门槛）：https://docs.dodopayments.com/features/payouts/payout-structure
- Lemon Squeezy 打款国家：https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Payoneer 大陆提现费率与限额（约 1.2%）：https://tianwenwangluo.com/payoneer-guide-2026/
- PayPal 大陆提现（电汇 $35/笔）：https://www.paypal.cn/portal/fees
- 国内独立站收单横评（开户费/保证金/结算周期）：http://www.investorscn.com/2026/07/07/133514/
