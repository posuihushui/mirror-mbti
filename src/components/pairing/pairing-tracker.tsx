"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { emitPairingEvent } from "@/lib/pairing-tracking";
export function PairingTracker({ resultId, surface, children }: { resultId: string; surface: "result" | "report" | "my_pairing"; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || seen.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || seen.current) return;
      seen.current = true; observer.disconnect();
      void emitPairingEvent("pairing_benefit_viewed", resultId, surface);
    }); observer.observe(node); return () => observer.disconnect();
  }, [resultId, surface]);
  return <div ref={ref} onClick={event => { if ((event.target as HTMLElement).closest('a[href*="/my/pairing"]')) void emitPairingEvent("pairing_entry_clicked", resultId, surface); }}>{children}</div>;
}
