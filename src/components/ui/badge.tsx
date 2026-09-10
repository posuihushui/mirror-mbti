import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva("inline-flex w-fit shrink-0 items-center justify-center rounded-[50px] border whitespace-nowrap", {
  variants: {
    variant: {
      /** `.type-tags > span` */
      tag: "border-[#cdd7db] px-[10px] py-[5px] text-[10px] text-[#5c6a70] md:px-[13px] md:py-[6px]",
      /** `.unlocked-badge` */
      unlocked: "gap-[5px] border-[#c5d4ca] px-[9px] py-1 text-[9px] text-[#738079]",
    },
  },
  defaultVariants: { variant: "tag" },
});

function Badge({ className, variant = "tag", ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
