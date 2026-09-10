import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type ButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "children" | "asChild">;

type Props = ButtonProps & {
  children: ReactNode;
  light?: boolean;
  /** Render as a `<Link>`; usable from Server Components. */
  href?: string;
  prefetch?: boolean;
};

/** `.primary` pill with the trailing arrow. */
export function PrimaryButton({ children, light = false, href, prefetch, className, ...props }: Props) {
  const variant = light ? "pillLight" : "pill";
  const content = (
    <>
      {children}
      <ArrowUpRight size={19} weight="light" />
    </>
  );
  if (href) {
    return (
      <Button variant={variant} className={cn(className)} asChild>
        <Link href={href} prefetch={prefetch} aria-label={props["aria-label"]}>
          {content}
        </Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} className={className} {...props}>
      {content}
    </Button>
  );
}
