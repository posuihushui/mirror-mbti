const zh = {
  browser: "我们也在自有数据库记录脱敏页面路径、访问时间、来源域名、手机／平板／电脑分类，并与签名浏览器标识关联，用于查看访问趋势和匿名浏览记录。私人页面的编号与全部查询参数会在浏览器和服务器两端移除；未知路径只记录为其他页面。浏览记录不含答案、偏好类型或分数，不保存原始 IP，仅授权管理人员可查看，并在 90 天后清理。统计失败不影响测试或支付。",
  telegram: "经授权的管理人员可通过 Telegram 管理机器人查询汇总访问数据和脱敏订单摘要，并接收订单状态通知。发送给 Telegram 的订单摘要只含截断的订单号、金额、币种、商品、价格类型、支付渠道、状态和记录时间，不含可用于恢复记录的完整订单号、访客标识、结果编号、作答、类型、分数或私人链接。Telegram 将按其服务规则处理消息。",
};
const en: typeof zh = {
  browser: "Our own database also records redacted page paths, visit times, referring domains and phone/tablet/desktop categories linked to the signed browser identifier, to understand visit trends and anonymous browsing records. Private page identifiers and all query parameters are removed in both the browser and server; unknown routes are recorded only as other pages. These records contain no answers, personality types or scores, store no raw IP addresses, are available only to authorized administrators and are removed after 90 days. Measurement failures do not affect tests or payments.",
  telegram: "Authorized administrators can use a Telegram management bot to query aggregate browsing data and redacted order summaries, and receive order-status notifications. Summaries sent to Telegram contain only a truncated order number, amount, currency, product, price type, payment channel, status and record time. They exclude full recovery order numbers, visitor identifiers, result IDs, answers, types, scores and private links. Telegram processes messages under its own service terms.",
};
export const adminPrivacyMessages = { zh, en };
