import { cn } from "cn";

/**
 * A loading placeholder in the page's own surfaces: line-toned on paper, faint on the night covers.
 * Loading screens reuse each page's frame, so the content lands where its placeholder stood.
 */
export function Skeleton({ className, tone = "paper" }: { className?: string; tone?: "paper" | "night" }) {
  return <div aria-hidden className={cn("animate-pulse rounded-[3px] motion-reduce:animate-none", tone === "night" ? "bg-white/[.07]" : "bg-line/70", className)} />;
}

/** The radar's empty grid (its rings and axes), so the chart draws into the frame that held its place. */
export function RadarFrame({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 300 300" style={{ height }} className="mx-auto block w-full" aria-hidden="true" focusable="false">
      {[25, 50, 75, 100].map((ring) => <circle key={ring} cx={150} cy={150} r={1.18 * ring} fill="none" stroke="#d6dee0" />)}
      <path d="M150 32V268M32 150H268" stroke="#d6dee0" />
    </svg>
  );
}
