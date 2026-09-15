import "server-only";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isPublishedLocale, type Locale } from "@/lib/i18n/locale";

/**
 * The current page locale for Server Components. Reads the `[lang]` root param, so it works in
 * any nested server component without prop drilling. Unknown or unpublished locales 404.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isPublishedLocale(value)) notFound();
  return value;
}
