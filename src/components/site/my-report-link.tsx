import Link from "next/link";
import type { ReactNode } from "react";
import type { TrackAttrs } from "@/lib/analytics/events";

/** Always let the server resolve history; localStorage is not proof of an empty account. `href` is the localized history URL. */
export function MyReportLink({ href = "/my/report", className, children, ...track }: { href?: string; className?: string; children: ReactNode } & Partial<TrackAttrs>) {
  return (
    <Link href={href} className={className} prefetch={false} {...track}>
      {children}
    </Link>
  );
}
