"use client";

import { useState } from "react";

/** The real value changes immediately. Only decorative digits transition;
 * there are no timers, intermediate counts, or queued updates. */
export function NumberMotion({ value, digits = 1, initialFrom = value }: { value: number; digits?: number; initialFrom?: number }) {
  const [snapshot, setSnapshot] = useState({ value, previous: initialFrom });
  if (snapshot.value !== value) {
    setSnapshot({ value, previous: snapshot.value });
  }
  const formatted = String(value).padStart(digits, "0");
  const previous = String(snapshot.previous).padStart(digits, "0").padStart(formatted.length, " ").slice(-formatted.length);
  return (
    <span className="number-motion" data-value={value} data-direction={value < snapshot.previous ? "down" : "up"}>
      <span className="sr-only">{formatted}</span>
      <span className="number-visual" aria-hidden="true">
        {Array.from(formatted, (digit, index) => (
          <span className="number-digit" key={formatted.length - index}>
            <span key={`${value}-current`} className={digit !== previous[index] ? "number-current number-changing" : "number-current"} data-digit={digit} />
            {digit !== previous[index] && previous[index]?.trim() && (
              <span key={`${value}-previous`} className="number-previous" data-digit={previous[index]} />
            )}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Keep localized sentences intact while animating their numeric tokens. */
export function NumberTextMotion({ children, initialFrom }: { children: string; initialFrom?: string }) {
  const previous = initialFrom?.split(/(\d+)/);
  return children.split(/(\d+)/).map((part, index) => index % 2
    ? <NumberMotion key={index} value={Number(part)} digits={part.length} initialFrom={previous?.[index] ? Number(previous[index]) : undefined} />
    : part);
}
