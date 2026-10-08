"use client";

import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { href, type Locale } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicShareSnapshot, ShareCandidate } from "@/lib/share-types";
import { NumberMotion } from "@/components/site/number-motion";
import { ShareCard } from "./share-card";
import { ShareActions } from "./share-actions";
import styles from "./share-motion.module.css";

export type OwnerShareItem = { id: string; resultId: string; token: string; url: string; imageUrl: string; snapshot: PublicShareSnapshot; createdAt: string; revokedAt: string | null };
export type ShareOptions = {
  candidates: ShareCandidate[]; defaultSelectedIds: string[]; recentShares: OwnerShareItem[];
  typeLabel?: string; typeNote?: string; dimensions?: PublicShareSnapshot["dimensions"];
};
export function ShareComposer({ resultId, locale, options, onRequest }: { resultId: string; locale: Locale; options: ShareOptions; onRequest?: (requestId: string) => void }) {
  const m = shareMessages[locale];
  const [selected, setSelected] = useState(options.defaultSelectedIds);
  const [showType, setShowType] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<OwnerShareItem | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const requestId = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  const lines = options.candidates.filter((item) => selected.includes(item.id)).map((item) => item.text);
  const snapshot: PublicShareSnapshot = {
    version: "share-v1", locale, lines: [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""], disclaimer: m.disclaimer,
    ...(showType && options.typeLabel ? { typeLabel: options.typeLabel, ...(options.typeNote ? { typeNote: options.typeNote } : {}) } : {}),
    ...(showDimensions && options.dimensions ? { dimensions: options.dimensions } : {}),
  };
  function edit() { requestId.current = null; setError(""); }
  function choose(id: string) {
    if (pending) return;
    if (!selected.includes(id) && selected.length >= 3) { setError(m.maximumSelected); return; }
    edit(); setSelected(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  }
  async function publish() {
    if (pending || selected.length !== 3) return;
    const id = requestId.current ?? crypto.randomUUID();
    requestId.current = id; onRequest?.(id);
    const version = ++generation.current;
    const abort = new AbortController(); controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 10000);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/shares", { method: "POST", cache: "no-store", signal: abort.signal, headers: { "Content-Type": "application/json", "X-Mirror-Locale": locale }, body: JSON.stringify({ resultId, selectedIds: selected, showType, showDimensions, consentVersion: "share-public-v1", requestId: id }) });
      const body = await response.json();
      if (version !== generation.current) return;
      if (!response.ok || !body.ok) {
        const code = body.error?.code;
        setError(code === "NO_SESSION" ? m.sessionUnavailable : code === "RATE_LIMITED" ? m.tooMany : code === "IDEMPOTENCY_CONFLICT" ? m.requestConflict : body.error?.message ?? m.error);
        return;
      }
      const item = body.data as OwnerShareItem;
      setCreated({ ...item, token: item.token ?? new URL(item.url, window.location.origin).pathname.split("/").at(-1)! });
    } catch { if (version === generation.current) setError(abort.signal.aborted ? m.timeout : m.error); }
    finally { clearTimeout(timer); if (version === generation.current) setPending(false); }
  }
  if (created) return <div className="mt-5 space-y-5" data-share-state="created">
    <p role="status" className={styles.success}><Check className={styles.check} size={18} aria-hidden="true" />{m.created}</p>
    <p className="text-xs leading-relaxed">{m.publicScope}：{m.linesOnly}{created.snapshot.typeLabel ? ` · ${m.referenceType}` : ""}{created.snapshot.dimensions ? ` · ${m.qualitativeDimensions}` : ""}</p>
    <ShareActions key={created.id} url={created.url} imageUrl={created.imageUrl} token={created.token} locale={locale} fallback={<ShareCard snapshot={created.snapshot} draft />} />
    <div className="flex flex-wrap items-center gap-4"><button type="button" className="text-link min-h-11" onClick={() => { setCreated(null); setAdjusting(true); edit(); }}>{m.adjust}</button><TextLink href={href(locale, "/my/shares")} prefetch={false}>{m.myShares}</TextLink></div>
  </div>;
  return <div className="mt-5 space-y-5" data-share-state={pending ? "submitting" : "editing"}>
    {adjusting && <p className="text-xs leading-relaxed">{m.newShareNotice}</p>}
    <fieldset disabled={pending} className="space-y-3">
      <legend className="mb-3 text-sm">{m.chooseThree} · {m.selected} <NumberMotion value={selected.length} /> / 3</legend>
      {options.candidates.map((item) => <label key={item.id} className={`${styles.candidate} flex cursor-pointer items-start gap-3 rounded-[4px] border border-line p-3 text-sm`} data-checked={selected.includes(item.id)}>
        <input type="checkbox" checked={selected.includes(item.id)} onChange={() => choose(item.id)} className="mt-1 size-4 shrink-0 accent-ink" />
        <span className="min-w-0 flex-1">{item.text}</span>{selected.includes(item.id) && <Check aria-hidden="true" size={16} className={`${styles.check} mt-1 shrink-0`} />}
      </label>)}
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={showType} onChange={(event) => { edit(); setShowType(event.target.checked); }} className="size-4 shrink-0 accent-ink" />{m.showType}</label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={showDimensions} onChange={(event) => { edit(); setShowDimensions(event.target.checked); }} className="size-4 shrink-0 accent-ink" />{m.showDimensions}</label>
    </fieldset>
    <p className="text-xs text-mist">{m.publicWarning}</p>
    <section aria-label={m.preview} className="space-y-3"><ShareCard snapshot={snapshot} draft /><p className="rounded border border-dashed border-line p-4 text-center text-xs text-mist">{m.previewPlaceholder}</p></section>
    <p role="status" className="text-sm leading-relaxed">{error || (pending ? m.publishing : "")}</p>
    <button type="button" onClick={publish} disabled={selected.length !== 3 || pending} className="pill min-h-11 w-full disabled:opacity-40">{pending ? m.publishing : m.publish}</button>
    {options.recentShares.length > 0 && <TextLink href={href(locale, "/my/shares")} prefetch={false}>{m.myShares}</TextLink>}
  </div>;
}
