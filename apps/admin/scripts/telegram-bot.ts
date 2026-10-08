import nextEnv from "@next/env";
import { createSql } from "@mirror/db";
import { setTimeout as delay } from "node:timers/promises";
import { filters, money, maskOrder, time, statusLabels, kindLabels } from "../src/lib/filters";
import { telegramConfig, authorizedTelegramMessage, telegramCommand, telegramHelp, notificationText, type Notification, type TelegramMessage } from "../src/lib/telegram-policy";
import { telegramCall, TelegramError } from "../src/lib/telegram-api";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const config = telegramConfig();
  const url = process.env.ADMIN_DATABASE_URL;
  if (!url) throw new Error("ADMIN_DATABASE_URL is required");
  const sql = createSql(url, { max: 3, idle_timeout: 20, connect_timeout: 5, connection: { application_name: "mirror-telegram", statement_timeout: 10000 } });
  // Hold a connection-scoped lock so two local workers cannot answer/push twice concurrently.
  const lock = await sql.reserve();
  const [acquired] = await lock`select pg_try_advisory_lock(741963852) as locked`;
  if (!acquired.locked) { lock.release(); await sql.end(); throw new Error("Another Telegram worker is already running"); }
  const signal = new AbortController();
  process.once("SIGINT", () => signal.abort()); process.once("SIGTERM", () => signal.abort());
  const sleep = (ms: number) => delay(ms, undefined, { signal: signal.signal }).catch(() => {});
  const send = (text: string) => telegramCall(config.token, "sendMessage", { chat_id: config.chatId, text: text.slice(0, 4000), protect_content: true, link_preview_options: { is_disabled: true } });
  async function command(kind: "summary" | "orders" | "traffic" | "help") {
    if (kind === "help") return telegramHelp;
    const f = filters({}, new Date()); const start = new Date(`${f.endDate}T00:00:00+08:00`);
    return await sql.begin("isolation level repeatable read read only", async tx => {
      if (kind === "orders") {
        const orders = await tx`select id, amount_fen, currency, kind, provider, status, created_at from orders order by created_at desc, id desc limit 10`;
        return "观己 · 最近订单\n" + (orders.map(o => `${maskOrder(o.id)} · ${statusLabels[o.status] ?? o.status}\n${kindLabels[o.kind] ?? o.kind} · ${money(o.amount_fen, o.currency)} · ${o.provider}\n${time(o.created_at)}`).join("\n\n") || "暂无订单。") + "\n\n模拟订单不计入收入。";
      }
      const [visits] = await tx`select count(*)::int as pv, count(distinct visitor_id)::int as uv from browser_events where created_at >= ${start} and created_at < ${f.end}`;
      if (kind === "traffic") {
        const pages = await tx`select path, count(*)::int as pv from browser_events where created_at >= ${start} and created_at < ${f.end} group by path order by pv desc, path limit 8`;
        return `观己 · 今日浏览（北京时间）\nPV ${visits.pv} · 浏览器 UV ${visits.uv}\n\n${pages.map(p => `${p.path} · ${p.pv} 次`).join("\n") || "暂无浏览数据。"}\n\n页面使用脱敏路径模板。`;
      }
      const [counts] = await tx`select (select count(*)::int from results where created_at >= ${start} and created_at < ${f.end}) as results, (select count(*)::int from orders where created_at >= ${start} and created_at < ${f.end}) as orders`;
      const revenue = await tx`select currency, kind, coalesce(sum(amount_fen), 0)::bigint as amount from orders where status = 'paid' and provider <> 'mock' and paid_at >= ${start} and paid_at < ${f.end} group by currency, kind order by currency, kind`;
      return `观己 · 今日概览（北京时间）\nPV ${visits.pv} · 浏览器 UV ${visits.uv}\n完成测试 ${counts.results}\n新建订单 ${counts.orders}\n\n已支付金额（按支付时间）\n${["CNY", "USD"].flatMap(c => ["report", "pair-gift"].map(k => `${c} · ${kindLabels[k]}：${money(Number(revenue.find(r => r.currency === c && r.kind === k)?.amount ?? 0), c)}`)).join("\n")}\n\n排除模拟和已退款订单；不是结算净额。`;
    }) as string;
  }
  async function notifications() {
    while (!signal.signal.aborted) {
      try {
        const pending = await sql<Notification[]>`select q.id, q.order_id, q.status, q.created_at, q.attempts, o.amount_fen, o.currency, o.kind, o.pricing, o.provider from telegram_outbox q join orders o on o.id = q.order_id where q.delivered_at is null and q.next_attempt_at <= now() and (${config.includeMock} or o.provider <> 'mock') order by q.id limit 10`;
        for (const row of pending) {
          if (signal.signal.aborted) break;
          try {
            await send(notificationText(row));
            await sql`update telegram_outbox set delivered_at = now(), attempts = attempts + 1 where id = ${row.id}`;
          } catch (error) {
            const retry = Math.min(3600, Math.max(error instanceof TelegramError ? error.retryAfter : 0, 15 * 2 ** Math.min(row.attempts, 8)));
            await sql`update telegram_outbox set attempts = attempts + 1, next_attempt_at = now() + ${retry} * interval '1 second' where id = ${row.id}`;
            console.error("订单推送暂时失败，已保留并安排重试。");
          }
          await sleep(1100);
        }
      } catch { console.error("订单通知队列暂时不可用。请检查数据库连接或迁移。"); }
      await sleep(5000);
    }
  }
  try {
    const webhook = await telegramCall<{ url: string }>(config.token, "getWebhookInfo", {});
    if (webhook.url) throw new Error("This bot has a webhook. Use a dedicated bot or remove its webhook before local polling.");
    const stateKey = `offset:${config.token.split(":")[0]}`;
    const [state] = await sql`select value from telegram_state where key = ${stateKey}`;
    let offset = Number(state?.value ?? 0);
    console.log("Telegram 机器人已启动：授权查询与订单通知。按 Ctrl+C 停止。");
    const pushes = notifications();
    let lastReply = 0;
    try {
      while (!signal.signal.aborted) {
        try {
          const updates = await telegramCall<{ update_id: number; message?: TelegramMessage }[]>(config.token, "getUpdates", { offset, timeout: 20, allowed_updates: ["message"] });
          for (const update of updates) {
            const msg = update.message;
            if (msg && authorizedTelegramMessage(msg, config) && (!msg.date || msg.date * 1000 > Date.now() - 300000)) {
              const kind = telegramCommand(msg.text);
              if (kind) {
                await sleep(Math.max(0, 1100 - (Date.now() - lastReply)));
                if (signal.signal.aborted) break;
                let text: string;
                try { text = await command(kind); } catch { text = "暂时无法读取数据，请检查数据库连接和迁移。"; }
                await send(text); lastReply = Date.now();
              }
            }
            offset = update.update_id + 1;
            await sql`insert into telegram_state (key, value) values (${stateKey}, ${String(offset)}) on conflict (key) do update set value = excluded.value`;
          }
        } catch (error) {
          if (error instanceof TelegramError && [401, 409].includes(error.code)) { console.error("机器人凭据无效或存在另一个轮询进程，已停止。"); signal.abort(); break; }
          console.error("Telegram 查询暂时失败，稍后重试。"); await sleep(error instanceof TelegramError ? Math.max(5000, error.retryAfter * 1000) : 5000);
        }
      }
    } finally { signal.abort(); await pushes; }
  } finally { lock.release(); await sql.end({ timeout: 5 }); }
}
main().catch((error) => {
  const known: Record<string, string> = {
    TELEGRAM_NOT_CONFIGURED: "请在 apps/admin/.env.local 填入 TELEGRAM_BOT_TOKEN、TELEGRAM_ADMIN_CHAT_ID；群聊还需要允许的用户 ID。",
    "ADMIN_DATABASE_URL is required": "请在 apps/admin/.env.local 配置 ADMIN_DATABASE_URL。",
    "Another Telegram worker is already running": "同一数据库已有机器人进程，请先停止它。",
    "This bot has a webhook. Use a dedicated bot or remove its webhook before local polling.": "此机器人已有 Webhook；请使用专用机器人或先自行移除 Webhook。",
  };
  console.error(error instanceof TelegramError ? error.message : known[error instanceof Error ? error.message : ""] ?? "机器人未能启动：检查配置与数据库连接。");
  process.exitCode = 1;
});
