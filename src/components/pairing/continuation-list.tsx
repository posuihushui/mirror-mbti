"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";
import { emitPairingResume } from "@/lib/pairing-tracking";
import { ArrowRight } from "@phosphor-icons/react";
export type ContinuationItem = { id: string; invitationToken: string; resultId: string; locale: Locale; continueUrl: string; expiresAt: string };
export function ContinuationList({ items, locale, surface = "result" }: { items: ContinuationItem[]; locale: Locale; surface?: "result" | "report" | "my_pairing" | "payment_sheet" | "pay_status" }) {
  const [cancelled, setCancelled] = useState<string[]>([]); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState("");
  const rows = items.filter(i => !cancelled.includes(i.id)); const m = pairingUiMessages[locale]; const s = shareMessages[locale];
  async function cancel(id: string) { if (pending) return; setPending(id); setError(""); try { const res = await fetch(`/api/comparison-continuations/${id}`, { method: "DELETE", headers: { "X-Mirror-Locale": locale } }); if (!res.ok) throw new Error(); setCancelled(c => [...c, id]); } catch { setError(s.error); } finally { setPending(null); } }
  if (!rows.length) return null;
  return <section data-pairing-continuations className="my-6 border border-line p-5"><h2 className="text-xl">{rows.length > 1 ? m.continueChoice : m.continue}</h2><p className="mt-3 text-xs text-mist">{m.continuationSaved}</p><ul className="mt-4 space-y-4">{rows.map((item, index) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3"><a href={item.continueUrl} className="pill min-h-11 text-sm md:w-auto md:min-w-64" onClick={() => emitPairingResume(item.id, surface)}>{m.continue}{rows.length > 1 ? ` · ${index + 1}` : ""}<ArrowRight size={19} weight="light" aria-hidden /></a><button type="button" className="text-link min-h-11 text-xs" disabled={pending !== null} onClick={() => cancel(item.id)}>{s.cancel}</button></li>)}</ul><p role="status" className="text-xs">{error}</p></section>;
}
