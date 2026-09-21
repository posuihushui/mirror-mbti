"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackAttrs } from "@/lib/analytics/events";
import { useRouter } from "next/navigation";
import { href, type Locale } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { emitPairingEvent } from "@/lib/pairing-tracking";
import { ContinuationList, type ContinuationItem } from "./continuation-list";
import styles from "./pairing.module.css";
type Access = { eligibility: "eligible" | "locked" | "unavailable" | "syncing"; continuations: ContinuationItem[]; unavailableInvitation?: boolean };
export function AccessActions({ resultId, locale, surface, onReady }: { resultId: string; locale: Locale; surface: "payment_sheet" | "pay_status" | "result"; onReady?: () => void }) {
  const [access, setAccess] = useState<Access | null>(null); const [error, setError] = useState(false); const [pending, setPending] = useState(false); const ready = useRef(false); const router = useRouter(); const m = pairingUiMessages[locale];
  const callback = useRef(onReady); useEffect(() => { callback.current = onReady; }, [onReady]);
  useEffect(() => { const controller = new AbortController(); void fetch(`/api/pairing-access?resultId=${encodeURIComponent(resultId)}`, { cache: "no-store", signal: controller.signal, headers: { "X-Mirror-Locale": locale } }).then(r => r.json()).then(body => { if (!body.ok) throw new Error(); setAccess(body.data); if (body.data.eligibility === "eligible" && !ready.current) { ready.current = true; callback.current?.(); } }).catch(() => { if (!controller.signal.aborted) setError(true); }); return () => controller.abort(); }, [resultId, locale]);
  async function retry() { if (pending) return; setPending(true); setError(false); try { const res = await fetch("/api/pairing-access", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "X-Mirror-Locale": locale }, body: JSON.stringify({ resultId }) }); const body = await res.json(); if (!body.ok) throw new Error(); setAccess(body.data); if (body.data.eligibility === "eligible") { if (!ready.current) { ready.current = true; callback.current?.(); } router.refresh(); } } catch { setError(true); } finally { setPending(false); } }
  if (access?.eligibility === "eligible") return <div data-pairing-access="eligible" className="mt-5"><p role="status" className={`${styles.status} text-sm leading-[1.8]`}>{m.ready}</p><p className="mt-2 text-xs leading-[1.8] text-mist">{m.readyRules}</p>{access.unavailableInvitation && <p role="status" className="mt-4 text-sm leading-[1.8]">{m.continuationExpired}</p>}<ContinuationList items={access.continuations} locale={locale} surface={surface} /><Link {...trackAttrs("read_report", surface === "payment_sheet" ? "payment_success" : surface === "pay_status" ? "pay_status" : "result_panel")} href={href(locale, `/report/${resultId}`)} className={`${access.continuations.length ? "text-link" : "pill"} mt-5 flex min-h-11 justify-center`}>{m.readReport}</Link><a href={href(locale, `/my/pairing?result=${resultId}`)} onClick={() => emitPairingEvent("pairing_entry_clicked", resultId, surface)} className="text-link mt-3 inline-flex min-h-11 text-sm">{m.invite}</a></div>;
  return <div data-pairing-access="syncing" className="my-5"><p role="status" className="text-sm leading-[1.8]">{error ? m.syncFailed : m.syncing}</p><button className="text-link mt-3 min-h-11 text-sm" type="button" disabled={pending} onClick={retry}>{m.retrySync}</button></div>;
}
