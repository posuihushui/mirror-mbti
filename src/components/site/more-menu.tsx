"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";
import type { CtaLocation } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Header "更多信息" disclosure (WAI-ARIA disclosure navigation): a button toggles a panel of
 * server-rendered links. The panel is only `hidden` while closed, so the links stay in the HTML for
 * crawlers; the language menu may render its options on open because hreflang covers crawlers.
 * Not a `<details>`: its implicit `group` role would sit on every page next to the quiz answer group.
 */
export function MoreMenu({
  label,
  location,
  className,
  children,
}: {
  label: string;
  location: CtaLocation;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (root.current?.contains(document.activeElement)) button.current?.focus();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className={cn("more-menu relative", className)}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) track("more_menu_open", { cta_location: location });
          setOpen(!open);
        }}
        className="flex min-h-11 items-center text-[12px] text-[#5d696d] hover:text-ink aria-expanded:text-ink"
      >
        <span className="flex items-center gap-[7px]">
          {label}
          <CaretDown size={11} aria-hidden className="more-menu-caret" />
        </span>
      </button>
      <div
        id={panelId}
        hidden={!open}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
        }}
        className="more-menu-panel absolute top-full right-0 z-40 mt-[6px] min-w-[180px] rounded-[4px] border border-line bg-[#f2f6f7] p-[6px] text-ink shadow-[0_14px_34px_rgba(21,28,31,0.12)]"
      >
        {children}
      </div>
    </div>
  );
}
