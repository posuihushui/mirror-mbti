"use client";
import { useEffect, useRef, useState } from "react";
import { href, type Locale } from "@/lib/i18n/locale";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { compareMessages } from "@/lib/i18n/messages/compare";

type Props = { invitationToken: string; resultId: string; resultLocale: Locale; locale: Locale; toResult?: boolean; children?: React.ReactNode };
/** Only an explicit click records continuation. No result or invitation data is shared by this operation. */
export function ContinuationAction({ invitationToken, resultId, resultLocale, locale, toResult = false, children }: Props) {
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const busy = useRef(false); const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const m = pairingUiMessages[locale];
  async function proceed() {
    if (busy.current) return; busy.current = true; setPending(true); setError("");
    const controller = new AbortController(); request.current = controller; const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/comparison-continuations", { method: "POST", cache: "no-store", signal: controller.signal, headers: { "Content-Type": "application/json", "X-Mirror-Locale": locale }, body: JSON.stringify({ invitationToken, resultId }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error?.message ?? compareMessages[locale].failed);
      window.location.assign(body.data.status === "completed" ? body.data.pairUrl : toResult ? href(resultLocale, `/result/${resultId}?compare=${encodeURIComponent(invitationToken)}`) : body.data.continueUrl);
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : compareMessages[locale].failed); else setError(compareMessages[locale].failed); }
    finally { clearTimeout(timeout); busy.current = false; setPending(false); }
  }
  return <div><button type="button" disabled={pending} onClick={proceed} className="pill min-h-11 disabled:opacity-50">{pending ? m.saving : children ?? m.registerContinue}</button><p role="status" className="mt-3 text-sm">{error}</p><noscript><p className="mt-3 text-xs leading-[1.8]">{m.noJs}</p></noscript></div>;
}
