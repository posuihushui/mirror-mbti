import { describe, expect, it, vi } from "vitest";
import { authorizedTelegramMessage, telegramCommand, notificationText, telegramConfig, type TelegramConfig } from "../../src/lib/telegram-policy";
import { telegramCall, TelegramError } from "../../src/lib/telegram-api";
const config: TelegramConfig = { token: "123:fake", chatId: "123", userIds: [], includeMock: false };
describe("Telegram management", () => {
  it("allows the configured private account and denies other chats, users and bots", () => {
    expect(authorizedTelegramMessage({ chat: { id: 123, type: "private" }, from: { id: 123 } }, config)).toBe(true);
    expect(authorizedTelegramMessage({ chat: { id: 123, type: "private" }, from: { id: 456 } }, config)).toBe(false);
    expect(authorizedTelegramMessage({ chat: { id: 456, type: "private" }, from: { id: 123 } }, config)).toBe(false);
    expect(authorizedTelegramMessage({ chat: { id: 123, type: "private" }, from: { id: 123, is_bot: true } }, config)).toBe(false);
    expect(authorizedTelegramMessage({ chat: { id: -123, type: "group" }, from: { id: 456 } }, { ...config, chatId: "-123", userIds: ["123"] })).toBe(false);
  });
  it("recognizes only supported commands, including group mentions", () => {
    expect(telegramCommand("/orders@mirror_bot")).toBe("orders");
    expect(telegramCommand("/traffic")).toBe("traffic");
    expect(telegramCommand("/start")).toBe("help");
    expect(telegramCommand("/refund 123")).toBeNull();
  });
  it("fails closed for missing config and groups without sender allowlists", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:" + "a".repeat(30)); vi.stubEnv("TELEGRAM_ADMIN_CHAT_ID", "-123"); vi.stubEnv("TELEGRAM_ALLOWED_USER_IDS", "");
    expect(() => telegramConfig()).toThrow("TELEGRAM_NOT_CONFIGURED"); vi.unstubAllEnvs();
  });
  it("does not expose a recovery credential, visitor or result in notifications", () => {
    const order = "M20261008ABCDEF123456ABCDEF1234";
    const text = notificationText({ id: 1, order_id: order, status: "paid", amount_fen: 550, currency: "CNY", kind: "report", pricing: "invite", provider: "mock", created_at: "2026-10-08T00:00:00Z", attempts: 0 });
    expect(text).not.toContain(order); expect(text).toContain("邀请价"); expect(text).toContain("模拟，不计入收入"); expect(text).toContain("5.50");
  });
  it("respects retry_after and redacts errors that might carry the bot token", async () => {
    const failing = vi.fn().mockResolvedValue(Response.json({ ok: false, error_code: 429, description: "secret", parameters: { retry_after: 40 } }, { status: 429 }));
    await expect(telegramCall(config.token, "sendMessage", {}, failing)).rejects.toMatchObject({ code: 429, retryAfter: 40 });
    const network = vi.fn().mockRejectedValue(new Error("https://api.telegram.org/botSECRET"));
    await expect(telegramCall(config.token, "getUpdates", {}, network)).rejects.toThrow("Telegram request failed (0)");
    expect(new TelegramError(401).message).not.toContain("secret");
  });
});
