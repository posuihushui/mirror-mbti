"use client";
import { useEffect } from "react";
export function ComparisonVisit({ pairId }: { pairId: string }) {
  useEffect(() => {
    let sent = false;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const eventId = crypto.randomUUID();
    const send = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      timer = setTimeout(() => abort.abort(), 800);
      void fetch("/api/share-events", { method: "POST", cache: "no-store", signal: abort.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, eventName: "comparison_viewed", pairId, surface: "pair", channel: "unknown" }) }).catch(() => {}).finally(() => clearTimeout(timer));
    };
    send(); document.addEventListener("visibilitychange", send);
    return () => { abort.abort(); clearTimeout(timer); document.removeEventListener("visibilitychange", send); };
  }, [pairId]);
  return null;
}
