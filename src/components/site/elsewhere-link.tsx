import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { TrackAttrs } from "@/lib/analytics/events";
import { href, htmlLang, type Locale } from "@/lib/i18n/locale";

/**
 * The owner lists (我的报告, 我的双人指南, 我的分享) show only the page's language, so no record on a Chinese
 * page opens an English one. What the visitor made in the other language is this one labelled link to
 * the same list there. A plain anchor, like the header's language options: another language is another
 * root layout, so it loads a fresh document.
 */
export function ElsewhereLink({ to, path, children, className, ...track }: { to: Locale; path: string; children: ReactNode; className?: string } & Partial<TrackAttrs>) {
  return (
    <a href={href(to, path)} hrefLang={htmlLang[to]} className={className ? `text-link ${className}` : "text-link"} data-elsewhere={to} {...track}>
      <span>{children}</span>
      <ArrowRight size={15} className="shrink-0" aria-hidden />
    </a>
  );
}
