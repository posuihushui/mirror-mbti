import { AppHeader } from "@/components/site/app-header";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { href, type Locale } from "@/lib/i18n/locale";
export function CompareUnavailable({ locale }: { locale: Locale }) {
  const m = compareMessages[locale];
  return <><AppHeader variant="page" title={m.title} backHref={href(locale, "/")} /><main data-share-static className="mx-auto max-w-[800px] px-6 py-14"><h1 className="text-[28px] leading-snug">{m.unavailable}</h1><p className="mt-5 text-sm leading-[1.8]">{m.unavailableBody}</p><a href={href(locale, "/quiz")} className="pill mt-7 inline-flex min-h-11">{m.start}</a></main></>;
}
