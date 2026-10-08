import { pageInfo } from "@/lib/analytics/url";

export type PairingEventName = "pairing_benefit_viewed" | "pairing_entry_clicked" | "pairing_checkout_opened";
export type PairingEventSurface = "result" | "report" | "my_pairing" | "payment_sheet" | "pay_status";

/** First-party only. Ownership, eligibility and deduplication are decided on the server. */
function send(payload: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    const locale = pageInfo(window.location.pathname).locale;
    void fetch("/api/share-events", {
      method: "POST", cache: "no-store", keepalive: true,
      headers: { "Content-Type": "application/json", "X-Mirror-Locale": locale },
      body: JSON.stringify({ ...payload, eventId: crypto.randomUUID(), channel: "unknown" }),
    }).catch(() => {});
  } catch { /* Optional measurement never blocks reading, payment or consent. */ }
}

export function emitPairingEvent(eventName: PairingEventName, resultId: string, surface: PairingEventSurface) {
  send({ eventName, resultId, surface });
}

export function emitPairingResume(continuationId: string, surface: PairingEventSurface) {
  send({ eventName: "pairing_resume_clicked", continuationId, surface });
}
