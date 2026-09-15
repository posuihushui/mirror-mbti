import Link from "next/link";
import type { ReactNode } from "react";

/** Always let the server resolve history; localStorage is not proof of an empty account. `href` is the localized history URL. */
export function MyReportLink({ href = "/my/report", className, children }: { href?: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={className} prefetch={false}>
      {children}
    </Link>
  );
}
