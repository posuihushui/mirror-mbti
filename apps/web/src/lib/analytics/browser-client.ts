import { browserPath } from "./browser-policy";

/** First-party only. Never send a full result, invitation, order or campaign URL. */
export function recordBrowserView(path: string, referrer: string) {
  try {
    const payload = { id: crypto.randomUUID(), path: browserPath(path).path, referrer: referrer ? new URL(referrer).origin : undefined };
    void fetch("/api/browser-events", {
      method: "POST", credentials: "same-origin", keepalive: true,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).catch(() => {});
  } catch { /* Measurement does not block navigation. */ }
}
