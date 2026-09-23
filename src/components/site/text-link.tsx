import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

type Props = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  /** ↗ and a plain `<a>` for anything that leaves the site (mail, wallets, hosted checkout). */
  external?: boolean;
};

/** Joined by hand: tailwind-merge reads `text-link` as a text colour and would drop it beside `text-mist`. */
function classes(className?: string) {
  return className ? `text-link ${className}` : "text-link";
}

/**
 * The site's one text-link style: a label and a trailing arrow, so a link never reads as plain text.
 * → stays on the site; ↗ leaves it. Usable from Server and Client Components.
 */
export function TextLink({ children, external = false, className, href, ...props }: Props) {
  const Icon = external ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span>{children}</span>
      <Icon size={15} className="shrink-0" aria-hidden />
    </>
  );
  if (external) {
    // An external link is a plain anchor: drop the router-only props `Link` would have consumed.
    const anchor: Record<string, unknown> = { ...props };
    for (const key of ["prefetch", "replace", "scroll", "shallow", "locale"]) delete anchor[key];
    return <a href={String(href)} className={classes(className)} {...(anchor as ComponentProps<"a">)}>{content}</a>;
  }
  return <Link href={href} className={classes(className)} {...props}>{content}</Link>;
}
