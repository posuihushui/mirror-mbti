import { TextLink } from "@/components/site/text-link";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { ShareManager } from "@/components/share/share-manager";
import { getLocale } from "@/lib/i18n/server";
import { href, otherLocale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { ElsewhereLink } from "@/components/site/elsewhere-link";
import { shareMessages } from "@/lib/i18n/messages/share";
import { getVisitorId } from "@/lib/session";
import { countSharesElsewhere, listOwnedShares } from "@/lib/shares";
export async function generateMetadata():Promise<Metadata>{const locale=await getLocale();return {title:shareMessages[locale].myShares,robots:{index:false,follow:false},referrer:"no-referrer"};}
export default async function MyShares(){const locale=await getLocale();const t=shareMessages[locale];const visitor=await getVisitorId();const [list,elsewhere]=visitor?await Promise.all([listOwnedShares(visitor,locale),countSharesElsewhere(visitor,locale)]):[{items:[],nextCursor:null},0];return <><AppHeader variant="page" title={t.myShares} backHref={href(locale,"/my/report")} path="/my/shares"/><main data-share-static className="mx-auto max-w-[1000px] px-[22px] py-8 md:px-10 md:py-14"><h1 className="mb-7 text-3xl">{t.myShares}</h1><TextLink href={href(locale,"/my/pairing")} prefetch={false} className="mb-7">{pairingUiMessages[locale].center}</TextLink>{elsewhere>0&&<p className="mb-7"><ElsewhereLink to={otherLocale(locale)} path="/my/shares">{pageMessages[locale].elsewhere.shares(elsewhere)}</ElsewhereLink></p>}<ShareManager {...list} locale={locale}/></main></>;}
