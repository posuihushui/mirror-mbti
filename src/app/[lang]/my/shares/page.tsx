import { ComparisonManager } from "@/components/compare/comparison-manager";
import { listOwnedComparisons } from "@/lib/comparisons";
import type { Metadata } from "next";
import { AppHeader } from "@/components/site/app-header";
import { ShareManager } from "@/components/share/share-manager";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { shareMessages } from "@/lib/i18n/messages/share";
import { getVisitorId } from "@/lib/session";
import { listOwnedShares } from "@/lib/shares";
export async function generateMetadata():Promise<Metadata>{const locale=await getLocale();return {title:shareMessages[locale].myShares,robots:{index:false,follow:false},referrer:"no-referrer"};}
export default async function MyShares(){const locale=await getLocale();const t=shareMessages[locale];const visitor=await getVisitorId();const list=visitor?await listOwnedShares(visitor):{items:[],nextCursor:null};const comparisons=visitor?await listOwnedComparisons(visitor):{items:[],invitations:[]};return <><AppHeader variant="page" title={t.myShares} backHref={href(locale,"/my/report")} path="/my/shares"/><main data-share-static className="mx-auto max-w-[1000px] px-[22px] py-8 md:px-10 md:py-14"><h1 className="mb-7 text-[30px]">{t.myShares}</h1><ShareManager {...list} locale={locale}/><ComparisonManager {...comparisons} locale={locale}/></main></>;}
