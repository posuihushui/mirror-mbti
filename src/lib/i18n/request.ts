import { defaultLocale, isPublishedLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Language for API messages that are returned before a result or order is known. Pages post from
 * the same origin, so the `Referer` path carries the locale prefix (`/en/...`); anything else is Chinese.
 */
export function requestLocale(request: Request): Locale {
  const referer = request.headers.get("referer");
  if (!referer) return defaultLocale;
  try {
    const segment = new URL(referer).pathname.split("/")[1] ?? "";
    return isPublishedLocale(segment) ? segment : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
