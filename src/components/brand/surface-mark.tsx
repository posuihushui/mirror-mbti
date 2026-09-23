import { BrandMark } from "./brand-logo";

/** Oversized, low-contrast brand relief for editorial covers. */
export function SurfaceMark({ className = "", tone = "paper" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <BrandMark
      size={384}
      tone={tone}
      monochrome
      className={`pointer-events-none absolute h-auto w-72 opacity-[0.08] md:w-96 ${className}`}
    />
  );
}
