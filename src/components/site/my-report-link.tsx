import Link from "next/link";
import type { ReactNode } from "react";

/** Always let the server resolve history; localStorage is not proof of an empty account. */
export function MyReportLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link href="/my/report" className={className} prefetch={false}>
      {children}
    </Link>
  );
}
