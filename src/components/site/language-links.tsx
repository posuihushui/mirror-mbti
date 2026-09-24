"use client";

import { useId } from "react";
import { Check } from "@phosphor-icons/react";
import { track } from "@/lib/analytics/track";
import { htmlLang, localeNames, type Locale } from "@/lib/i18n/locale";
import { useMoreMenuOpen } from "./more-menu";

/** `href` is resolved by `AppHeader` on the server; the current language has none. */
export type LanguageOption = { locale: Locale; href?: string };

/**
 * The language group at the end of the header's 更多 menu. Options are plain anchors: another language
 * is another root layout (`<html lang>`), so switching always loads a fresh document. The current
 * language is marked and is not a link. Options render only while the menu is open, so an English page
 * never carries 中文 in its HTML; crawlers follow the head's hreflang alternates instead.
 */
export function LanguageLinks({ options, label, itemClassName }: { options: LanguageOption[]; label: string; itemClassName: string }) {
  // A labelled list rather than role="group": tests find the quiz's answers as the page's one group.
  const id = useId();
  const open = useMoreMenuOpen();
  return (
    <div data-language-options>
      <p id={id} className="px-3 pt-1 pb-1 text-xs text-mist">{label}</p>
      {open && <ul aria-labelledby={id}>
        {options.map((option) => (
          <li key={option.locale}>
            {option.href ? (
              <a
                href={option.href}
                hrefLang={htmlLang[option.locale]}
                lang={htmlLang[option.locale]}
                className={itemClassName}
                onClick={() => track("language_switch", { language_to: option.locale })}
              >
                {localeNames[option.locale].name}
              </a>
            ) : (
              <span aria-current="true" lang={htmlLang[option.locale]} className={`${itemClassName} justify-between gap-6 text-ink`}>
                {localeNames[option.locale].name}
                <Check size={14} aria-hidden />
              </span>
            )}
          </li>
        ))}
      </ul>}
    </div>
  );
}
