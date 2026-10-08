import * as React from "react";
import { cn } from "cn";

/**
 * Hairline progress bar matching the prototype's native `<progress>` styling.
 * Renders a plain element so it works in Server Components.
 */
function Progress({
  className,
  value = 0,
  max = 100,
  indicatorClassName,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { value?: number; max?: number; indicatorClassName?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("relative block h-[3px] w-full overflow-hidden bg-line", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn("h-full bg-ink transition-[width] duration-300", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
