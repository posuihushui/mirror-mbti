import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { TrackAttrs } from "@/lib/analytics/events";

type ButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "children" | "asChild">;

type Props = ButtonProps &
  Partial<TrackAttrs> & {
    children: ReactNode;
    light?: boolean;
    /** → moves within the site (default); ↗ only when the button leaves it, e.g. for a hosted checkout. */
    icon?: "next" | "external" | "none";
    /** Render as a `<Link>`; usable from Server Components. */
    href?: string;
    prefetch?: boolean;
  };

/** `.primary` pill with a trailing arrow. Spread `trackAttrs(...)` to count clicks as `cta_click`. */
export function PrimaryButton({ children, light = false, icon = "next", href, prefetch, className, ...props }: Props) {
  const variant = light ? "pillLight" : "pill";
  const Icon = icon === "external" ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {children}
      {icon === "none" ? null : <Icon size={19} weight="light" />}
    </>
  );
  if (href) {
    return (
      <Button variant={variant} className={cn(className)} asChild>
        <Link href={href} prefetch={prefetch} aria-label={props["aria-label"]} data-track={props["data-track"]} data-track-location={props["data-track-location"]}>
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
