import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
export default async function UnavailableShare(){const locale=await getLocale();const t=shareMessages[locale];return <main data-share-static className="mx-auto max-w-[680px] px-6 py-16"><h1 className="text-[28px]">{t.unavailable}</h1><a href={href(locale,"/quiz")} className="pill mt-7 inline-flex">{t.start}</a></main>;}
