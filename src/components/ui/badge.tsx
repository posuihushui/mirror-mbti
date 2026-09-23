import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva("inline-flex w-fit shrink-0 items-center justify-center rounded-[50px] border whitespace-nowrap", {
  variants: {
    variant: {
      /** `.type-tags > span` */
      tag: "border-line px-3 py-1 text-xs leading-snug text-mist",
      /** `.unlocked-badge` */
      unlocked: "gap-1.5 border-[#c5d4ca] px-3 py-1 text-xs leading-snug text-[#4f6552]",
    },
  },
  defaultVariants: { variant: "tag" },
});

function Badge({ className, variant = "tag", ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
