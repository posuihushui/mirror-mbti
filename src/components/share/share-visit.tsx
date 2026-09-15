"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import type { Locale } from "@/lib/i18n/locale";

type ShareEvent = "share_browser_visible" | "share_link_copied" | "share_image_requested" | "share_quiz_started";
type Surface = "result" | "share_page" | "my_shares" | "invitation" | "quiz";

/** Only a best-effort first-party event. No personal content enters analytics. */
export async function recordShareEvent(token: string | undefined, eventName: ShareEvent, surface: Surface = "share_page", timeout = 800, eventId = crypto.randomUUID()) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch("/api/share-events", {
      method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, eventName, ...(token ? { shareToken: token } : {}), surface, channel: eventName === "share_image_requested" ? "image" : eventName === "share_quiz_started" ? "unknown" : "link" }),
    });
    return response.ok;
  } catch { return false; }
  finally { clearTimeout(timer); }
}

export function recordShareQuizStarted() {
  return recordShareEvent(undefined, "share_quiz_started", "quiz");
}

export function ShareVisit({ token, locale, surface = "share_page" }: { token: string; locale: Locale; surface?: "share_page" | "invitation" }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = marker.current;
    if (!node) return;
    let visible = false;
    let sent = false;
    let disposed = false;
    const eventId = crypto.randomUUID();
    const send = () => {
      if (!visible || sent || disposed || document.visibilityState !== "visible") return;
      sent = true;
      void recordShareEvent(token, "share_browser_visible", surface, 800, eventId).then((ok) => { if (!disposed && !ok) sent = false; });
    };
    const card = node.closest("main")?.querySelector("[data-share-card]") ?? node;
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; send(); });
    if (observer) observer.observe(card);
    else { visible = true; send(); }
    document.addEventListener("visibilitychange", send);
    return () => { disposed = true; observer?.disconnect(); document.removeEventListener("visibilitychange", send); };
  }, [token, surface]);
  return <span ref={marker} data-share-visit={locale} aria-hidden="true" />;
}

/** Ordinary href remains usable without JS; tracking never holds navigation >800ms. */
export function ShareQuizLink({ token, locale, href, children, className, surface = "share_page" }: { token: string; locale: Locale; href: string; children: ReactNode; className?: string; surface?: "share_page" | "invitation" }) {
  const leaving = useRef(false);
  async function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (leaving.current) return;
    leaving.current = true;
    await recordShareEvent(token, "share_browser_visible", surface);
    window.location.assign(href);
  }
  return <a href={href} lang={locale} onClick={navigate} className={className}>{children}</a>;
}
