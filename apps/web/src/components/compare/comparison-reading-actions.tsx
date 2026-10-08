"use client";

import { TextLink } from "@/components/site/text-link";
import { useState, type ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { CompareRevoke } from "./compare-revoke";

/** Interactive withdrawal shell; authorized reading content arrives as server children. */
export function ComparisonReadingActions({ id, locale, children }: { id: string; locale: Locale; children: ReactNode }) {
  const [withdrawn, setWithdrawn] = useState(false);
  const m = compareMessages[locale];
  if (withdrawn) return <section><p role="status">{m.revoked}</p><TextLink href={href(locale, "/my/pairing")} prefetch={false} className="mt-5">{m.comparisons}</TextLink></section>;
  return <>{children}<div className="mt-8 border-t border-line pt-6"><CompareRevoke id={id} locale={locale} onRevoked={() => setWithdrawn(true)} /></div></>;
}
