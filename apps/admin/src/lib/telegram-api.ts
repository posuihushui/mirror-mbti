export class TelegramError extends Error {
  constructor(public code: number, public retryAfter = 0) { super(`Telegram request failed (${code})`); }
}
/** Never include a token-bearing URL or Telegram response text in errors/logs. */
export async function telegramCall<T>(token: string, method: "getUpdates" | "sendMessage" | "getWebhookInfo", params: object, fetcher: typeof fetch = fetch): Promise<T> {
  let res: Response;
  try {
    res = await fetcher(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params), signal: AbortSignal.timeout(method === "getUpdates" ? 30000 : 10000) });
  } catch { throw new TelegramError(0); }
  let data: { ok?: boolean; result?: T; error_code?: number; parameters?: { retry_after?: number } };
  try { data = await res.json(); } catch { throw new TelegramError(res.status); }
  if (!res.ok || !data.ok) throw new TelegramError(data.error_code ?? res.status, data.parameters?.retry_after ?? 0);
  return data.result as T;
}
