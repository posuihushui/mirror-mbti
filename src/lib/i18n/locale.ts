/**
 * Site locales. English is the default and keeps unprefixed URLs (served from `app/[lang]`
 * as `en` through the proxy rewrite); every other locale lives under its own prefix.
 */
export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Locales whose pages are published. Removing one 404s its pages and drops its hreflang pairs. */
export const publishedLocales: readonly Locale[] = ["en", "zh"];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPublishedLocale(value: string): value is Locale {
  return (publishedLocales as readonly string[]).includes(value);
}

/** `href("en", "/quiz")` → `/quiz`; `href("zh", "/quiz")` → `/zh/quiz`. */
export function href(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export const htmlLang: Record<Locale, string> = { zh: "zh-CN", en: "en" };

/** Each language named in itself for the language menu; `short` fits the phone header. */
export const localeNames: Record<Locale, { name: string; short: string }> = {
  zh: { name: "中文", short: "中文" },
  en: { name: "English", short: "EN" },
};
export const ogLocale: Record<Locale, string> = { zh: "zh_CN", en: "en_US" };
