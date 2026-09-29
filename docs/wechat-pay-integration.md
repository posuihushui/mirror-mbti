# 微信支付接入与上线执行手册

> 核对日期：2026-09-27。适用于本站**中文问卷产生的人民币订单**，采用普通商户直连微信支付 API v3。当前仓库已有 JSAPI、H5、Native 下单、通知和查单代码，但**尚未完成商户配置和真实交易验收**；[上线前代码门槛](#上线前代码门槛)也尚未关闭。商户后台实际可申请的权限以微信审核结果为准。

## 先决定要开放哪些入口

本站按下单请求的浏览器环境自动选择渠道，运营配置中没有单独关闭某个微信渠道的开关。

| 买家环境 | 本站渠道 | 微信侧所需权限 | 买家动作 |
| --- | --- | --- | --- |
| 微信内置浏览器 | JSAPI | JSAPI 支付、已认证且绑定商户号的公众号 | 在当前页面调起微信收银台 |
| 微信外手机浏览器 | H5 | H5 支付、审核通过的 H5 支付域名 | 跳到微信付款，再回本站订单页 |
| 电脑浏览器 | Native | Native 支付及绑定的 APPID | 手机微信扫一扫二维码 |

实际选择逻辑在 [`src/lib/ua.ts`](../src/lib/ua.ts)，中文订单的 provider 由 `PAYMENT_PROVIDER` 决定，英文订单由独立的 `EN_PAYMENT_PROVIDER` 决定。H5 仅适用于微信外手机浏览器；微信内必须走 JSAPI。微信[H5 产品说明](https://pay.wechatpay.cn/doc/v3/merchant/4012791832)明确限定这一点。官方[主体权限表](https://pay.wechatpay.cn/doc/v3/merchant/4015616699)显示，个体工商户和小微商户不能申请 H5；若商户属于这两类，应先设计并实现微信外手机入口的替代处理，再开放真实支付。

## 第一阶段：申请和后台配置

1. **确认主体与经营资料。** 在[微信支付入驻指引](https://pay.wechatpay.cn/static/applyment_guide/applyment_index.shtml)申请普通商户号，准备主体证明、结算账户、真实客服信息、站点经营内容及所需资质。保存获批的商户号 `mchid`，确认商户后台的经营主体、网站主体和实际售卖内容一致。
2. **申请产品权限。** 在商户平台分别核实 [JSAPI](https://pay.wechatpay.cn/doc/v3/merchant/4015423216)、[H5](https://pay.wechatpay.cn/doc/v3/merchant/4015614193)、[Native](https://pay.wechatpay.cn/doc/v3/merchant/4015614538) 的开通状态。需要哪一种，就完成哪一种的审核；本站目前会自动选择三种，因此未获批的场景必须在上线前处理。
3. **准备公众号与绑定。** JSAPI 使用已认证的服务号或符合条件的公众号 APPID。由商户平台发起 APPID 绑定，再由公众平台管理员确认。`WECHAT_PAY_APPID` 和 `WECHAT_MP_APPID` 在当前实现中应填写**同一个已绑定公众号 APPID**：前者用于微信支付下单，后者用于 `snsapi_base` 网页授权取该 APPID 下的 OpenID；`WECHAT_MP_SECRET` 是公众号密钥。公众号后台还需把站点域名配置为网页授权域名。[JSAPI 开发准备](https://pay.wechatpay.cn/doc/v3/merchant/4015423216)列明认证、绑定及授权目录要求。若开启本站微信 JS-SDK 分享，再配置该域名的 JS 接口安全域名；分享开关与支付开关相互独立。
4. **配置 JSAPI 支付授权目录。** 本站从中文结果页及相关中文付款弹层调起支付，建议在商户平台「产品中心 → 开发配置」配置生产站点的根目录，例如 `https://example.com/`，从而覆盖 `/zh/result/...` 等实际调起页面。目录必须与浏览器中的协议、域名一致，以 `/` 结尾；不能填本地 IP。根目录与精确目录的校验规则见[官方目录说明](https://pay.wechatpay.cn/doc/v3/merchant/4013287088)。
5. **配置 H5 支付域名。** 在商户平台「产品中心 → 开发配置 → H5 支付」填写实际从浏览器跳往微信的生产域名，按后台要求提供备案与经营页面材料，等待审核生效。域名格式及审核要求见[官方 H5 域名说明](https://pay.wechatpay.cn/doc/v3/merchant/4013287193)。当前 H5 回跳使用同一 `APP_URL` 下的 `/zh/pay/[orderId]`。
6. **取得 API v3 凭据。** 准备商户 API 证书**私钥**及其序列号、32 字符 API v3 密钥，再从商户后台「账户中心 → API 安全 → 微信支付公钥」取得**微信支付公钥及公钥 ID**。[API v3 概述](https://pay.wechatpay.cn/doc/v3/merchant/4012081606)推荐公钥模式；[公钥获取说明](https://pay.wechatpay.cn/doc/v3/merchant/4013038816)给出后台入口。商户私钥用于本站签请求，微信支付公钥用于验微信的通知和应答，二者不能互换。凭据只写入服务端密钥配置，不发到浏览器、聊天或仓库。

## 第二阶段：配置本站

先部署公开 HTTPS 域名，配置 `DATABASE_URL`、生产 `SESSION_SECRET`，执行数据库迁移并检查 `/api/health`。`APP_URL` 在**构建和运行**时都设成最终来源地址，例如 `https://example.com`，不要带 `/zh` 或末尾 `/`。更换公开域名后重新构建。

在部署平台的服务端密钥设置中填写下列变量；[`.env.example`](../.env.example)是字段清单，不是放真实密钥的地方。

| 变量 | 填什么 |
| --- | --- |
| `WECHAT_PAY_MCHID` | 获批的普通商户号 |
| `WECHAT_PAY_APPID` | 已与商户号绑定的公众号 APPID |
| `WECHAT_PAY_SERIAL_NO` | **商户 API 证书**序列号，不是微信支付公钥 ID |
| `WECHAT_PAY_PRIVATE_KEY` | 与上述序列号配套的商户 API 私钥 PEM；多行可按 `.env.example` 用 `\n` 转义 |
| `WECHAT_PAY_APIV3_KEY` | 商户后台设置的 32 字符 API v3 密钥 |
| `WECHAT_PAY_PUBLIC_KEY_ID` / `WECHAT_PAY_PUBLIC_KEY` | 同一把**微信支付公钥**的 ID（`PUB_KEY_ID_...`）和 PEM，建议成对配置 |
| `WECHAT_MP_APPID` / `WECHAT_MP_SECRET` | 公众号 APPID（与支付 APPID 一致）和公众号密钥，供 JSAPI 取 OpenID |
| `WECHAT_PAY_NOTIFY_URL` | 可留空，默认 `${APP_URL}/api/payments/wechat/notify`；若覆盖，必须是公网 HTTPS 完整路径且不带查询参数 |
| `PRICE_FEN` / `INVITE_PRICE_FEN` / `GIFT_PRICE_FEN` | 人民币**分**，默认 690 / 550 / 490；订单金额由服务端报价决定 |
| `PAYMENT_PROVIDER` | 生产环境在上线前保持 `mock`；先在隔离验收环境修复代码门槛、切到 `wechat` 并重启，真实交易验收通过后再切生产 |

通知 URL 对应仓库的 [`src/app/api/payments/wechat/notify/route.ts`](../src/app/api/payments/wechat/notify/route.ts)。它无需访客 cookie，应允许微信服务器直接 POST。微信[通知地址要求](https://pay.wechatpay.cn/doc/v3/merchant/4012075420)规定公网 HTTPS、完整路径、无查询参数，且不应进行登录态校验。反向代理须把真实客户端 IP 正确传给本站，H5 下单会把它作为 `payer_client_ip`；不能用 `127.0.0.1`。

当前代码也支持留空 `WECHAT_PAY_PUBLIC_KEY*` 后拉取平台证书，但这条路径的首次证书信任尚需单独审查。新接入优先使用微信支付公钥模式，并在上线前完成[API 应答验签](#上线前代码门槛)。不要把“能下单”当成密钥及验签已通过。

## 第三阶段：按顺序验收

先修复[上线前代码门槛](#上线前代码门槛)，然后在隔离的验收环境使用获准的商户配置并设 `PAYMENT_PROVIDER=wechat`。`mock` 只验证本站页面流程，不产生微信侧账单。生产切换前，先处理同一中文站已有的待支付 mock 订单。每个获准入口各做一笔可对账的小额真实订单，依次覆盖正常支付、取消支付和付款后回站。

1. **微信内 JSAPI：** 用真实微信打开 `/zh/quiz`，完成测试，在真实结果页付款。首次尝试应经 `/api/wechat/oauth` 和 `/api/wechat/oauth/callback` 静默获取 OpenID，再回原结果页；确认价格未变、微信收银台显示正确商户和金额、付款后订单变 `paid`，对应完整报告可读。`getBrandWCPayRequest` 的前端成功回调只触发本站查单，不能单凭它解锁。
2. **微信外手机 H5：** 从已审核域名的浏览器页面发起，检查跳转、微信支付、返回 `/zh/pay/[orderId]`。核对订单状态与报告权益；不要把浏览器回跳视为到账证明。官方[H5 开发指引](https://pay.wechatpay.cn/doc/v3/merchant/4012791831)要求商户结合通知或查单确认结果。
3. **电脑 Native：** 在中文结果页显示二维码，使用微信**扫一扫**付款，等待页面更新；[Native 产品说明](https://pay.wechatpay.cn/doc/v3/merchant/4012791874)说明不支持以相册识别或长按识别代替扫一扫完成该流程。
4. **逐单对账：** 以本站 `out_trade_no`（订单号）在微信商户平台或[商户单号查单接口](https://pay.wechatpay.cn/doc/v3/merchant/4012526919)核对 `SUCCESS`、微信交易号、人民币分金额与付款时间，再核对本站 `paid` 和报告授权。覆盖原价、邀请价、请 TA 三种价格，以及重复通知、刷新订单页、网络中断后恢复。
5. **异常复测：** 检查取消、超时、通知迟到、已扣款但页面未更新、OAuth 失败、H5 域名不符、公钥或证书轮换。保留原订单号并先查微信账单，避免让买家重复付款。记录一笔真实交易的回调 HTTP 状态、本站事件记录和商户账单作为验收证据；日志中不要写私钥、API v3 密钥或完整 OpenID。

## 上线前代码门槛

以下是 2026-09-27 对**当前代码**的核对结果。它们需要在真实支付开放前修复并用相应测试验证；本文不代表已修复。

| 优先级 | 当前行为 | 完成条件 |
| --- | --- | --- |
| 阻断 | [`WeChatPayClient.request`](../src/lib/payments/wechat/client.ts)签出站请求，但直接解析成功应答；尚未按 `Wechatpay-*` 头验签。主动查单结果因而不能作为可信的授权依据。 | 在使用任何下单、查单、关单成功应答前验证微信签名；安全处理公钥或平台证书轮换及首次信任。[官方验签说明](https://pay.wechatpay.cn/doc/v3/merchant/4013053249) |
| 阻断 | [`refreshOrder`](../src/lib/orders.ts)把查单 `SUCCESS` 映射为已付；[`mapTradeState`](../src/lib/payments/wechat/index.ts)未核对查询返回的商户号、APPID、`out_trade_no`、币种和实付金额。通知路径也把金额设为可选，未核对商户号、APPID、币种及交易号。 | 通知与查单都强制核对订单 ID、商户、APPID、CNY 金额，缺字段或不一致则拒绝授权；重复投递仍幂等。[官方查单字段](https://pay.wechatpay.cn/doc/v3/merchant/4012526919)、[通知字段](https://pay.wechatpay.cn/doc/v3/merchant/4012791861) |
| 阻断 | 微信订单过期后，本站会将其设为 `expired`；[`markOrderPaid`](../src/lib/orders.ts)默认只允许 `created → paid`，晚到但真实成功的通知不能补发权益。 | 对微信侧确认为 `SUCCESS` 的交易提供可审计的过期补偿与对账路径，避免“已扣款、报告未开”；同时明确关单与重试边界。 |
| 上线运维 | 当前没有定时对账任务；主动查单依赖访客打开订单页，且切换 provider 会停止旧订单主动查单。 | 建立日常微信账单与本站订单核对、差异工单和密钥轮换流程；切换前处理旧待支付订单。微信[回调说明](https://pay.wechatpay.cn/doc/v3/merchant/4012791861)也要求结合查单，不能只依赖通知。 |

## 常见故障定位

| 现象 | 先核对 |
| --- | --- |
| 微信内无法调起收银台 | JSAPI 权限、APPID 绑定、支付授权目录；浏览器确实为微信内置浏览器；OAuth 获得的是同一 APPID 的 OpenID |
| H5 报“未配置的参数”或无法回跳 | H5 权限与审核域名、页面实际来源及 `redirect_url` 域名；浏览器不在微信内部；真实客户端 IP。见[官方 H5 常见问题](https://pay.wechatpay.cn/doc/v3/merchant/4012791845) |
| 回调 401 或一直未解锁 | `Wechatpay-Serial` 指向的公钥 ID/证书、API v3 密钥、机器时间、回调公网可达性及反向代理；按商户单号向微信主动查单 |
| 微信已扣款，本站仍待支付或过期 | 保留原订单号和微信交易号，先查微信真实交易状态，再按[上线前代码门槛](#上线前代码门槛)处理差异；不要直接让买家再次付款 |
| 下单报权限、签名或参数错误 | 对照商户号、APPID 绑定、商户证书序列号与私钥是否配套，以及当前渠道是否真正获批；记录微信 API 应答 `Request-ID` 供排查 |

## 交付记录模板

| 项目 | 填写结果 |
| --- | --- |
| 商户号及主体、已获批的 JSAPI / H5 / Native 权限 | 待填写 |
| 生产站点域名、JSAPI 授权目录、H5 支付域名 | 待填写 |
| 公众号 APPID 已绑定、网页授权域名已配置 | 待填写 |
| 商户 API 证书到期日、公钥 ID、轮换负责人（**不要填密钥内容**） | 待填写 |
| 三渠道真实订单号、微信交易号、金额及本站权益一致 | 待填写 |
| 上线前代码门槛、异常用例、日常对账负责人 | 待填写 |

相关总览见[支付申请、使用与稳定性指南](payment-operations.md)。
