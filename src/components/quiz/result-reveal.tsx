"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { MirrorMorph } from "@/components/brand/mirror-morph";
import type { MirrorProfile } from "@/components/brand/mirror-mark";
import { useLocale } from "@/lib/i18n/locale-provider";
import { quizMessages } from "@/lib/i18n/messages/quiz";

/** How long the reveal holds before the result page takes over. */
export const REVEAL_MS = 1500;

/**
 * The moment between the last answer and the result: the brand mark reshapes itself into this
 * result's mark and the four letters arrive. It plays once, only after a submission, only when the
 * reader allows motion; a tap skips it. The result page carries all of it again in text.
 */
export function ResultReveal({ profile, onDone }: { profile: MirrorProfile; onDone: () => void }) {
  const t = quizMessages[useLocale()].runner;
  const done = useRef(false);
  // A tap skips the rest; the timer and the tap both land here, and only the first one navigates.
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  const onTimeout = useEffectEvent(finish);

  useEffect(() => {
    const timer = window.setTimeout(() => onTimeout(), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={finish}
      className="result-reveal fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-night px-6 text-paper"
    >
      <MirrorMorph profile={profile} size={176} />
      <p className="mt-10 flex gap-3 text-5xl font-medium tracking-tight" aria-label={profile.type}>
        {profile.type.split("").map((letter, i) => (
          <span key={i} aria-hidden className="result-reveal-letter" style={{ animationDelay: `${420 + i * 110}ms` }}>{letter}</span>
        ))}
      </p>
      <p className="result-reveal-letter mt-5 text-sm text-night-body" style={{ animationDelay: "900ms" }}>{t.revealCaption}</p>
    </div>
  );
}

/** Whether the reveal should play at all. */
export function revealAllowed() {
  return typeof window.matchMedia === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
