"use client";

import { CaretDown, Check, GlobeSimple } from "@phosphor-icons/react";
import { cn } from "cn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { htmlLang, localeNames, type Locale } from "@/lib/i18n/locale";

/** `href` is resolved by `AppHeader` on the server; the current language has none. */
export type LanguageOption = { locale: Locale; href?: string };

/**
 * Header language dropdown. Options are plain anchors: another language is another root layout
 * (`<html lang>`), so switching always loads a fresh document.
 */
export function LanguageMenu({
  current,
  options,
  label,
  compact = false,
  top = false,
  className,
}: {
  current: Locale;
  options: LanguageOption[];
  label: string;
  /** Phone header: short code, no globe. */
  compact?: boolean;
  /** Align with a neighbouring text link whose label sits at the top of its 44px box (phone home header). */
  top?: boolean;
  className?: string;
}) {
  const name = localeNames[current];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "flex min-h-11 text-[12px] text-[#5d696d] outline-none hover:text-ink focus-visible:text-ink data-[state=open]:text-ink",
          top ? "items-start" : "items-center",
          className,
        )}
      >
        <span className="flex items-center gap-[7px]">
          {!compact && <GlobeSimple size={15} weight="light" aria-hidden />}
          <span className="sr-only">{label}: {name.name}</span>
          <span aria-hidden="true">{compact ? name.short : name.name}</span>
          <CaretDown size={11} aria-hidden className="language-caret" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label={label}>
        {options.map((option) =>
          option.href ? (
            <DropdownMenuItem key={option.locale} asChild>
              <a href={option.href} hrefLang={htmlLang[option.locale]} lang={htmlLang[option.locale]}>
                {localeNames[option.locale].name}
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={option.locale} aria-current="true" lang={htmlLang[option.locale]}>
              {localeNames[option.locale].name}
              <Check size={14} aria-hidden />
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
