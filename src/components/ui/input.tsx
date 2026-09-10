import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "min-h-[55px] w-full min-w-0 rounded-[3px] border border-line bg-transparent px-[15px] py-3 text-[16px] text-ink transition-colors outline-none placeholder:text-mist focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
