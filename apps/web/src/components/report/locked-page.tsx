"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { cn } from "cn";
import type { TrackAttrs } from "@/lib/analytics/events";

const TOUCH = "(hover: none)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(TOUCH);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type Props = {
  href: string;
  /** The link's accessible name: the chapter, and that unlocking opens it. */
  label: string;
  /** The note shown above the page; it repeats the label, so it is hidden from assistive technology. */
  chapter: string;
  note: string;
  /** On phones the first page's note starts at its left edge and the last page's ends at its right, so neither runs off the screen. */
  align?: "start" | "center" | "end";
  track: TrackAttrs;
  children: ReactNode;
};

/**
 * A locked page on `/my/report`. Hovering or focusing it shows the chapter it holds and that unlocking
 * opens it; a click goes to the unlock sheet. A touch screen has no hover, so the first tap shows the note
 * and the second follows the link, and a tap anywhere else puts the note away.
 */
export function LockedPage({ href, label, chapter, note, align = "center", track, children }: Props) {
  const touch = useSyncExternalStore(subscribe, () => window.matchMedia(TOUCH).matches, () => false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Click tracking runs before this handler; a first tap that only shows the note is not a click on the CTA.
  const armed = open || !touch;
  const shown = "hidden group-hover/locked:block group-focus-visible/locked:block group-data-open/locked:block";
  return (
    <Link
      ref={ref}
      href={href}
      prefetch={false}
      aria-label={label}
      data-open={open ? "" : undefined}
      onClick={(event) => {
        if (armed) return;
        event.preventDefault();
        setOpen(true);
      }}
      className="group/locked relative block"
      {...(armed ? track : {})}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-[calc(100%+8px)] z-20 w-max max-w-52 rounded-md bg-ink px-3 py-2 text-xs text-paper shadow-[0_6px_18px_rgb(18_23_24/0.18)]",
          align === "start" ? "left-0 md:left-1/2 md:-translate-x-1/2" : align === "end" ? "right-0 md:right-auto md:left-1/2 md:-translate-x-1/2" : "left-1/2 -translate-x-1/2",
          shown,
        )}
      >
        <span className="block text-night-mist">{chapter}</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          {note}
          <ArrowRight size={12} aria-hidden className="shrink-0" />
        </span>
      </span>
      <span aria-hidden className={cn("absolute bottom-[calc(100%+3px)] left-1/2 z-20 -ml-[5px] border-[5px] border-transparent border-t-ink", shown)} />
      {children}
    </Link>
  );
}
