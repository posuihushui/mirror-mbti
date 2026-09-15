"use client";
import { useState, type ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { CompareRevoke } from "./compare-revoke";
export function ComparisonReading({ id, locale, children }: { id: string; locale: Locale; children: ReactNode }) {
  const [withdrawn, setWithdrawn] = useState(false);
  const m = compareMessages[locale];
  if (withdrawn) return <section><p role="status">{m.revoked}</p><a href={href(locale, "/my/shares")} className="text-link mt-5 inline-flex min-h-11">{m.comparisons}</a></section>;
  return <>{children}<div className="mt-8 border-t border-line pt-6"><CompareRevoke id={id} locale={locale} onRevoked={() => setWithdrawn(true)} /></div></>;
}
