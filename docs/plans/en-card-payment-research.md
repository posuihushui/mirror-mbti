# 英文站银行卡收款方案调研（2026-09-16）

**背景**：`/en` 目前只有 USDT/USDC 链上直收（`EN_PAYMENT_PROVIDER=crypto`）。想再加银行卡（Visa/Mastercard）收款。
约束：没有外币银行卡/海外银行账户，但**可以把钱提现成虚拟货币**。

> 续篇：法币路径（不碰加密货币，直接打款到支付宝/国内银行卡）单独调研在 [en-card-payment-fiat-path.md](./en-card-payment-fiat-path.md)，结论是 Creem 与 Waffo Pancake 两家官方支持大陆个人收款人。

---

## 0. 结论先行

1. **先改价，再谈通道。** 现在 `PRICE_USD_CENTS=100`（$1）。任何卡通道都有固定费（$0.30~$0.50/笔），$1 定价下手续费占 40%~50%，这个价位做卡收款在商业上不成立。建议英文报告定价提到 **$5~$9**，或者按"报告 + 对比/复测"打包。
2. **最省事的主路线：MoR（记录商户）平台 + 稳定币提现。** 首选 **Creem**：3.9% + $0.40 收单，支持 **USDC(Polygon) 提现到自有钱包**（提现再收 2%，余额满 $50 起付，每月 1 号/15 号打款）。它替你做 seller of record、代缴税、扛拒付，你只要一个钱包地址，不需要外币银行账户。备选 **Whop**（可提现到加密钱包，但 5% + $1 的提现费 + 3% 手续费，综合更贵）。
3. **真·卡收单直连链上结算**（Alchemy Pay / Coinflow / SpherePay 这类）技术上最干净：买家刷卡，USDT/USDC 分钟级进你钱包。代价是要 **公司主体做 KYB**（Coinflow 的 MSA 审核要 1~3 周），而且**拒付风险由你承担**。个人主体基本走不通。
4. **不要碰"免 KYC 收卡、结算 USDT"那类广告**（NexaPay 之类，靠 TechBullion/MEXC News 这种付费稿铺量）。卡组织规则要求收单方做 KYB，做不到就意味着你的交易挂在别人的 MID 下（factoring），一旦被查就是冻结跑路，钱要不回来。
5. **顺带提醒一个可能被忽略的前提**：你写的是"没有外币银行卡"，但"收美元"不等于"要有外币卡"。Waffo Pancake（3.9% + $0.50，支持大陆个人，人民币提现到银行卡/支付宝）、Payoneer（Paddle 支持它做打款）、PayPal 这些路径可以**直接把美元结汇到国内人民币卡**，不需要碰加密货币。如果你其实不排斥走合规法币路径，这条比稳定币提现更省手续费、也更好做账。**已在 [en-card-payment-fiat-path.md](./en-card-payment-fiat-path.md) 展开核实。**

---

## 1. 需求拆解

| 维度 | 要求 |
| --- | --- |
| 买家侧 | Visa / Mastercard，最好带 Apple Pay / Google Pay；结账在 `/en/pay/[orderId]` 或跳 hosted checkout |
| 商家侧 | 结算落到**加密钱包**或**国内可提现账户**；不能要求海外银行账户 |
| 主体 | 目前应为大陆个人（无公司主体）→ 这是最大的筛选条件 |
| 金额 | 现 $1；小额数字商品，天然是**盗卡测试（card testing）**的靶子 |
| 系统 | 要能接进现有 `PaymentProvider` 抽象（`createPayment` / `queryPayment` + webhook 幂等） |

---

## 2. 方案地图

### A 类：MoR 平台代收 + 加密提现（推荐，个人可做）

平台是法律上的卖家，负责收单、VAT/销售税、拒付；你只从平台提现。

| 平台 | 收单费率 | 加密提现 | 提现门槛 | 备注 |
| --- | --- | --- | --- | --- |
| **Creem** | 3.9% + $0.40 | ✅ USDC on Polygon，**2% 提现费** | 余额 ≥ $50，每月 1/15 号 | 面向独立开发者，非欧盟法币提现另收 $7 或 1%；拒付 $25/次 |
| **Whop** | ~3% | ✅ USDC/USDT 钱包（已接 Tether WDK） | — | 提现 **5% + $1**，综合成本可到 7~8%；平台带市场属性 |
| **Dodo Payments** | ~4% + $0.40 | ❌ 打款仍需**银行账户**（Persona KYC + bank details） | — | 它宣传的 "stablecoin" 是**收**稳定币，不是给你加密打款 |
| Paddle / Lemon Squeezy / Polar | 5% / 5% + 50¢ / 4% + 40¢ | ❌ | — | Paddle 支持 **Payoneer** 打款（法币路径）；Polar 走 Stripe Connect，必须银行账户 |

### B 类：卡收单直连、链上结算（技术最优，需要公司主体）

买家刷卡 → 服务商收单 → 直接把 USDC/USDT 打进你的钱包，你自己管拒付。

- **Coinflow**：刷卡授权后几分钟内 USDC 到商户链上钱包，专做 web3/游戏；KYB 秒过但 MSA 审核 1~3 周。
- **Alchemy Pay**：173 个国家的卡收单网络，商户**默认按 USDT-TRC20 结算**（也可谈别的币种/法币），支持实时（S0）或 D+X 结算。新交所背景、持牌，但面向企业客户。
- **SpherePay**：稳定币收付 API，支持 payment link 同时收法币与稳定币，文档称可以 onboard **个人**（individuals）也可以 onboard 企业 —— 这条是 B 类里唯一值得替个人主体去问一问的。

### C 类：加密网关 + 法币入金（on-ramp）通道（形似卡支付，实则不是）

- **NOWPayments 的 fiat payments**：买家用 Visa/Master 付，网关通过第三方 on-ramp 换成加密货币打给你；服务费 0.5%（但 on-ramp 那一层的费率另算，通常 4%+）。
- **MoonPay Commerce（原 Helio）**：2% 手续费，**非托管**，链上点对点直接到你钱包；卡支付是通过 MoonPay/Onramper 在结账里给买家"用卡买币"。
- ⚠️ **共同硬伤**：on-ramp 有最低购买额（通常 $20~$30）且买家自己要过 KYC。对 $1~$9 的商品，这条路等于让买家为了买你的报告先去实名买 $30 的币 —— 转化率会归零。**这类只适合已经持币的用户，对"想刷卡的人"没用。**

### D 类：不碰加密的法币路径（如果你只是缺外币卡）

- **Waffo Pancake**：3.9% + $0.50，明确支持大陆个人，人民币提现到银行卡/支付宝，$20 起提。
- **Payoneer / WorldFirst**：配合 Paddle 等 MoR 打款，再结汇到国内卡。
- **PayPal**：自带卡 guest checkout，但大陆账号的跨境收款限制和风控需单独确认。
- 长期方案是注册美国 LLC / 香港公司，直接上 Stripe（Stripe 现在也支持**稳定币打款**，覆盖 69 国、计划 2026 年底扩到 160+ 市场，稳定币收单费率 1.5%）。成本是每年 $200~$500 的主体维护费 + 报税。

### 已出局

- **Coinbase Commerce**：已宣布 **2026-03-31 关闭**，美国/新加坡以外的商户没有 Coinbase Business 可迁，必须换服务商。
- **"免 KYC 卡收单 + USDT 结算"广告站**：见结论第 4 条。

---

## 3. 成本模型（以 Creem 为例）

| 售价 | 收单 3.9% + $0.40 | 净入平台 | 2% USDC 提现后 | 综合成本率 |
| --- | --- | --- | --- | --- |
| $1 | $0.439 | $0.561 | **$0.550** | **45.0%** |
| $5 | $0.595 | $4.405 | **$4.317** | 13.7% |
| $9 | $0.751 | $8.249 | **$8.084** | 10.2% |
| $19 | $1.141 | $17.859 | **$17.502** | 7.9% |

对照：现有链上直收几乎只付 gas，但只覆盖"已经有钱包和 USDC"的人群。所以卡通道的价值是**扩大可付款人群**，不是省钱；用它就得接受 10%+ 的通道成本，并把价格提到能吸收固定费的区间。

---

## 4. 风险与合规要点

- **拒付 / 盗卡测试**：低客单价数字商品是 card testing 的首选目标。走 MoR 的最大好处就是这层由平台扛（Creem 也仍会按 $25/次向你收拒付费）。自建收单（B 类）必须自己上 3DS、限频、设备指纹。
- **主体与 KYC**：A 类通常是个人 KYC 即可；B 类几乎都要 KYB（营业执照/董事资料）。这是能不能落地的第一道门。
- **法律文案要改**：用 MoR 之后，`/en` 的条款要写明"订单由 <平台> 作为 seller of record 处理、开票与退款由其负责"；隐私政策要按仓库规矩更新——付款环节会把邮箱/IP/卡后四位交给第三方，这属于"发送的数据变了"。
- **加密相关**：大陆主体做境外加密结算属政策灰区，与现有 USDT/USDC 直收同源风险，这里不新增判断，只提示别把它当成"比法币更安全"的路径。
- **不要破坏既有不变式**：`UNCLEAR_RESULT` 服务端拒单、`/report/[id]` 服务端鉴权、已付报告永不回收，这些与新通道无关，必须保持。

---

## 5. 接进本仓库要动什么

现状：`payment_provider` enum = `mock | wechat | crypto`，`payment_channel` enum = `mock | jsapi | native | h5 | ethereum | solana`，`getPaymentProvider(mode)` 按订单语言选 provider，`refreshOrder` 永远按 `order.provider` 回查。

以接入 **Creem（A 类，hosted checkout + webhook）** 为例：

1. **env**：新增 `EN_PAYMENT_PROVIDER=... | card`（或单独 `CARD_PAYMENT_PROVIDER`），`CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`、`CREEM_PRODUCT_ID`；`PRICE_USD_CENTS` 调到新定价。`src/lib/env.ts:16` 的 zod enum 要同步放宽。
2. **schema 迁移**：`payment_provider` 加 `creem`，`payment_channel` 加 `card`；`npm run db:generate` 并提交 `drizzle/` 下的 SQL。
3. **PaymentPayload 新分支**：`{ kind: "redirect"; url: string }`（hosted checkout 无法在站内渲染卡表单——站内收卡意味着 PCI 范围，不要自己做）。`payment-sheet.tsx` / `crypto-payment.tsx` 旁边加一个 `card-payment.tsx`，只负责跳转 + 回跳后轮询。
4. **provider 实现** `src/lib/payments/creem/`：`createPayment` 调 Creem 创建 checkout session（`request_id` 用订单号，保持 `id` 即 out_trade_no 的约定）；`queryPayment` 回查订单状态；`closePayment` 可选。签名校验逻辑单独放 `crypto.ts` 保持纯函数可单测，与 `wechat/crypto.ts` 同构。
5. **webhook**：`src/app/api/payments/creem/webhook/route.ts`，先 `await connection()`，验签后写 `payment_events`（按 provider event id 幂等），再置订单为已付。复用现有的"一条支付事件只能付一单"约束。
6. **结账页**：`/en/pay/[orderId]` 需要让用户在 **Card / Crypto** 之间选（订单创建时就要定 channel，因为 provider 存在订单上）。文案全部进 `src/lib/i18n/messages/*`，mock 模式继续显示 "Demo" 标签。
7. **测试**：webhook 验签单测；`tests/e2e` 在 mock 模式下覆盖"选卡 → 跳转占位 → 回跳 → 已付"；不要真跑外部 API。

若改选 **B 类（Coinflow / Alchemy Pay）**，结构一样，差别是：结算回执是链上事件，可以复用现有 `PaymentCandidate` / `claimPaymentEvent` 那套；但要额外加 3DS 与风控，并自己处理 refund/chargeback 分支。

---

## 6. 需要你拍板的三件事

1. **主体**：维持大陆个人，还是愿意开 HK/US LLC？前者基本锁死在 A 类 + D 类，后者 B 类和 Stripe 全开。
2. **定价**：英文报告是否接受从 $1 提到 $5~$9？不提价就没必要接卡。
3. **结算偏好**：一定要落到加密钱包（→ Creem/Whop），还是其实接受人民币提现（→ Waffo Pancake/Payoneer，费率更低、账更好做）？

---

## 参考

- Creem 提现文档（USDC on Polygon / 2% / $50 起付）：https://docs.creem.io/merchant-of-record/finance/payouts ，定价 https://www.creem.io/pricing
- Coinbase Commerce 关停与迁移：https://help.coinbase.com/en/transitioning-from-coinbase-commerce-to-coinbase-business
- MoonPay Commerce（原 Helio）FAQ（2% / 非托管 / 卡通过 MoonPay·Onramper）：https://support.moonpay.com/en/articles/466267-moonpay-commerce-faqs
- Coinflow 文档：https://docs.coinflow.cash/
- SpherePay 文档（个人/企业均可 onboard）：https://docs.spherepay.co/introduction
- Alchemy Pay 商户结算（USDT-TRX 默认，S0 / D+X）：https://alchemypay.readme.io/docs/alchemy-pay-crypto-payment
- NOWPayments 法币收款说明：https://nowpayments.io/help/payments/fiat-payments
- Dodo Payments 打款结构（需银行账户）：https://docs.dodopayments.com/features/payouts/payout-structure
- Stripe 稳定币打款覆盖：https://stripe.com/use-cases/crypto
- 中文侧对比（Waffo Pancake / Creem / Dodo 大陆提现）：https://dyordo.com/zh/creator-tools/indie-payment-platforms-2026/
