import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center whitespace-nowrap select-none outline-none disabled:cursor-default disabled:opacity-35 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** `.primary` pill from the prototype. */
        pill: "pill justify-between",
        /** `.primary.light` */
        pillLight: "pill pill-light justify-between",
        /** `.text-link` */
        link: "text-link",
        /** `.back-button` */
        back: "back-button",
        /** Unstyled: layout classes come from the call site. */
        plain: "",
      },
    },
    defaultVariants: {
      variant: "plain",
    },
  },
);

function Button({
  className,
  variant = "plain",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
