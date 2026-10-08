import { maskOrder, money, time, statusLabels, kindLabels, pricingLabels } from "./filters";
export type TelegramMessage = { chat: { id: number; type?: string }; from?: { id: number; is_bot?: boolean }; text?: string; date?: number };
export type TelegramConfig = { token: string; chatId: string; userIds: string[]; includeMock: boolean };
export function telegramConfig(): TelegramConfig {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";
  const userIds = (process.env.TELEGRAM_ALLOWED_USER_IDS ?? "").split(",").map(v => v.trim()).filter(Boolean);
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token) || !/^-?\d+$/.test(chatId) || chatId === "0" || userIds.some(v => !/^[1-9]\d*$/.test(v)) || (chatId.startsWith("-") && !userIds.length)) throw new Error("TELEGRAM_NOT_CONFIGURED");
  return { token, chatId, userIds, includeMock: process.env.TELEGRAM_INCLUDE_MOCK === "true" };
}
export function authorizedTelegramMessage(msg: TelegramMessage, config: TelegramConfig) {
  if (String(msg.chat.id) !== config.chatId || !msg.from || msg.from.is_bot) return false;
  return config.userIds.length ? config.userIds.includes(String(msg.from.id)) : msg.chat.type === "private" && String(msg.from.id) === config.chatId;
}
export function telegramCommand(text: string | undefined): "summary" | "orders" | "traffic" | "help" | null {
  const cmd = text?.trim().split(/\s+/, 1)[0].split("@", 1)[0].toLowerCase();
  if (["/start", "/help"].includes(cmd ?? "")) return "help";
  return cmd === "/summary" ? "summary" : cmd === "/orders" ? "orders" : cmd === "/traffic" ? "traffic" : null;
}
export type Notification = { id: number; order_id: string; status: string; amount_fen: number; currency: string; kind: string; pricing: string; provider: string; created_at: Date | string; attempts: number };
export function notificationText(row: Notification) {
  return ["观己 · 订单通知", `${row.status === "created" ? "新订单" : "状态更新"} · ${statusLabels[row.status] ?? row.status}`,
    `订单：${maskOrder(row.order_id)}`, `商品：${kindLabels[row.kind] ?? row.kind} · ${pricingLabels[row.pricing] ?? row.pricing}`,
    `金额：${money(row.amount_fen, row.currency)}`, `渠道：${row.provider}${row.provider === "mock" ? "（模拟，不计入收入）" : ""}`, `记录时间：${time(row.created_at)}`].join("\n");
}
export const telegramHelp = "观己管理机器人\n/summary — 今日经营概览\n/orders — 最近 10 笔订单\n/traffic — 今日访问与热门页面\n/help — 命令说明\n\n仅授权账号可查询；金额按币种区分，实付统计排除模拟订单。";
