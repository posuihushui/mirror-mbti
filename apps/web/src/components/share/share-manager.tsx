"use client";

import { TextLink } from "@/components/site/text-link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { href, type Locale } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import type { OwnerShareItem } from "./share-composer";
import { ShareCard } from "./share-card";
import { ShareActions } from "./share-actions";
import styles from "./share-motion.module.css";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";

export function ShareManager({ items, nextCursor, locale }: { items: OwnerShareItem[]; nextCursor: string | null; locale: Locale }) {
  const m = shareMessages[locale];
  const router = useRouter();
  const [more, setMore] = useState<OwnerShareItem[]>([]);
  const [cursor, setCursor] = useState(nextCursor);
  const [closed, setClosed] = useState<string[]>([]);
  const [preview, setPreview] = useState<OwnerShareItem | null>(null);
  const [confirm, setConfirm] = useState<OwnerShareItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; pending.current?.abort(); }; }, []);
  const list = [...items, ...more.filter((item) => !items.some((existing) => existing.id === item.id))];
  async function loadMore() {
    if (!cursor || loading) return;
    const controller = new AbortController(); pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/shares?cursor=${encodeURIComponent(cursor)}`, { cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: controller.signal });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error("LOAD_FAILED");
      if (alive.current) { setMore((current) => [...current, ...body.data.items]); setCursor(body.data.nextCursor); }
    } catch { if (alive.current) setError(m.error); }
    finally { clearTimeout(timer); if (alive.current) setLoading(false); }
  }
  async function revoke() {
    if (!confirm || closing) return;
    const id = confirm.id;
    const controller = new AbortController(); pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    setClosing(true); setError("");
    try {
      const response = await fetch(`/api/shares/${encodeURIComponent(id)}`, { method: "DELETE", cache: "no-store", headers: { "X-Mirror-Locale": locale }, signal: controller.signal });
      if (!response.ok) throw new Error("CLOSE_FAILED");
      if (alive.current) { setClosed((current) => [...current, id]); setPreview((current) => current?.id === id ? null : current); setConfirm((current) => current?.id === id ? null : current); requestAnimationFrame(() => document.getElementById(`share-row-${id}`)?.focus()); router.refresh(); }
    } catch { if (alive.current) setError(m.error); }
    finally { clearTimeout(timer); if (alive.current) setClosing(false); }
  }
  return <div className="space-y-8" data-share-manager>
    {!list.length && <p>{m.empty} <TextLink href={href(locale, "/my/report")} prefetch={false}>{m.myReports}</TextLink></p>}
    {list.map((item) => {
      const revoked = !!item.revokedAt || closed.includes(item.id);
      return <article key={item.id} id={`share-row-${item.id}`} tabIndex={-1} className="space-y-4 border-b border-line pb-8" data-share-status={revoked ? "closed" : "active"}>
        <div className="flex flex-wrap justify-between gap-3 text-xs"><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.createdAt))}</time><span className={revoked ? styles.status : undefined}>{revoked ? m.revoked : m.active}</span></div>
        <ShareCard snapshot={item.snapshot} />
        <p className="text-xs leading-relaxed">{m.publicScope}：{m.linesOnly}{item.snapshot.typeLabel ? ` · ${m.referenceType}` : ""}{item.snapshot.dimensions ? ` · ${m.qualitativeDimensions}` : ""}</p>
        {!revoked && <div className="flex flex-wrap gap-4 print:hidden"><button type="button" className="pill min-h-11" onClick={(event) => { trigger.current = event.currentTarget; setPreview(item); }}>{m.preview} · {m.copy}</button><button type="button" className="text-link min-h-11" disabled={closing} onClick={(event) => { trigger.current = event.currentTarget; setError(""); setConfirm(item); }}>{m.closeShare}</button><TextLink href={href(locale, `/my/pairing?result=${encodeURIComponent(item.resultId)}&share=${encodeURIComponent(item.id)}`)} prefetch={false}>{pairingUiMessages[locale].center}</TextLink></div>}
      </article>;
    })}
    <p role="status" className="text-sm">{!confirm && error}</p>
    {cursor && <button type="button" className="pill min-h-11" disabled={loading} onClick={loadMore}>{loading ? m.loading : m.loadMore}</button>}
    <noscript><p>{m.noJs}</p></noscript>
    <ResponsiveSheet open={!!preview} onOpenChange={(open) => { if (!open) { setPreview(null); requestAnimationFrame(() => trigger.current?.focus()); } }} title={m.preview} description={m.publicWarning} closeLabel={m.close}>
      {preview && <div className="mt-4"><ShareActions key={preview.id} url={preview.url} imageUrl={preview.imageUrl} token={preview.token} locale={locale} surface="my_shares" fallback={<ShareCard snapshot={preview.snapshot} draft />} /></div>}
    </ResponsiveSheet>
    <ResponsiveSheet open={!!confirm} onOpenChange={(open) => { if (!open) { setConfirm(null); requestAnimationFrame(() => trigger.current?.focus()); } }} title={m.closeShare} description={m.closeConfirmation} closeLabel={m.close}>
      <p role="status" className="mt-4 text-sm">{error}</p><div className="mt-5 flex gap-3"><button type="button" className="pill min-h-11 flex-1" disabled={closing} onClick={revoke}>{closing ? m.closing : m.closeShare}</button><button type="button" className="text-link min-h-11 flex-1" onClick={() => { setConfirm(null); requestAnimationFrame(() => trigger.current?.focus()); }}>{m.cancel}</button></div>
    </ResponsiveSheet>
  </div>;
}
