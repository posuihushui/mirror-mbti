"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { LockSimple } from "@phosphor-icons/react";

export type ResultNavItem = { id: string; label: string; locked: boolean };

/** A section counts as current once its top passes the upper third of the viewport (never less than just under the nav). */
const threshold = () => Math.max(140, window.innerHeight / 3);

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

/** The last section whose top has passed the threshold, read straight from the layout. */
function useCurrentSection(ids: string) {
  const getSnapshot = useCallback(() => {
    let current = "";
    const line = threshold();
    for (const id of ids.split(" ")) {
      const top = document.getElementById(id)?.getBoundingClientRect().top;
      if (top !== undefined && top <= line) current = id;
    }
    return current;
  }, [ids]);
  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}

/**
 * A real result's sticky section nav, 16personalities-style: the free sections, then the report's
 * chapters with a lock until it is unlocked, and on desktop the report itself as a separate action
 * at the right end (`children`), so the offer stays in reach at every scroll depth. Phones keep that
 * action in the dock. The links are plain anchors in the server HTML; this island only marks the
 * current section and keeps it in view in the phone strip.
 */
export function ResultNav({ label, lockedLabel, items, children }: { label: string; lockedLabel: string; items: ResultNavItem[]; children?: ReactNode }) {
  const current = useCurrentSection(items.map((item) => item.id).join(" "));
  const strip = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = strip.current;
    const link = current ? list?.querySelector<HTMLElement>(`[href="#${current}"]`) : null;
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: link.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
  }, [current]);

  return (
    <nav aria-label={label} data-result-nav className="sticky top-0 z-4 mt-4 mb-8 border-b border-line bg-paper md:mt-0 md:mb-10">
      <div className="flex items-center gap-6">
        <ol ref={strip} className="flex min-w-0 flex-1 gap-6 overflow-x-auto px-6 [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] [scrollbar-width:none] md:gap-7 md:px-0 [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                aria-current={current === item.id ? "location" : undefined}
                className="group relative flex min-h-12 items-center gap-1.5 text-sm whitespace-nowrap text-mist transition-colors hover:text-ink aria-[current=location]:text-ink md:min-h-14"
              >
                {item.locked && <LockSimple size={13} aria-hidden className="shrink-0" />}
                {item.label}
                {item.locked && <span className="sr-only">{lockedLabel}</span>}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-warm opacity-0 group-aria-[current=location]:opacity-100" />
              </a>
            </li>
          ))}
        </ol>
        {children && <div className="hidden shrink-0 md:block">{children}</div>}
      </div>
    </nav>
  );
}
