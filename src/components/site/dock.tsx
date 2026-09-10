import type { ReactNode } from "react";
import { cn } from "cn";

/** `.web-mobile-dock`: fixed bottom action bar on phones, hidden from 721px up. */
export function Dock({ variant = "page", className, children }: { variant?: "home" | "page"; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-6 px-6 pt-[13px] md:hidden",
        variant === "home" ? "bg-transparent pb-safe-5" : "bg-paper pb-safe-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
