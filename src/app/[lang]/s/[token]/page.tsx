import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { ShareCard } from "@/components/share/share-card";
import { ShareVisit, ShareQuizLink } from "@/components/share/share-visit";
import { getPublicShare } from "@/lib/shares";
import { WeChatShare } from "@/components/site/wechat-share";
import { appUrl, env } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { getLocale } from "@/lib/i18n/server";
import { shareMessages } from "@/lib/i18n/messages/share";
import { siteCopy } from "@/lib/site";
type Props = { params: Promise<{token: string}> };
export async function generateMetadata({params}: Props): Promise<Metadata> {
 const {token}=await params; const share=await getPublicShare(token);
 if (!share) return {title: "mirror", robots: {index:false,follow:false}, openGraph:null, twitter:null};
 const t=shareMessages[share.locale]; const url=appUrl()+href(share.locale, `/s/${token}`);
 // The share decides its own language, so the title is absolute: the layout template would otherwise
 // append the Chinese site name to an English card opened on an unprefixed URL.
 return {title:{absolute:`${t.title} · ${siteCopy(share.locale).name}`}, description:t.publicDescription, alternates:{canonical:url}, robots:{index:false,follow:false}, referrer:"no-referrer", openGraph:{title:t.title,description:t.publicDescription,url,siteName:"mirror",type:"website",locale:share.locale==="en"?"en_US":"zh_CN",images:[{url:`${url}/opengraph-image`,width:1200,height:630,alt:t.imageAlt}]},twitter:{card:"summary_large_image",title:t.title,description:t.publicDescription,images:[`${url}/opengraph-image`]}};
}
export default async function PublicShare({params}: Props) {
 const {token}=await params; const share=await getPublicShare(token); if (!share) notFound();
 const locale=await getLocale(); if(locale!==share.locale) redirect(href(share.locale,`/s/${token}`));
 const t=shareMessages[locale];
 return <><AppHeader variant="page" title={t.title} backHref={href(locale,"/")} /><main data-share-static className="mx-auto max-w-[1060px] px-[22px] py-8 md:px-10 md:py-14"><div className="grid gap-8 md:grid-cols-[minmax(0,520px)_1fr] md:items-center md:gap-14"><ShareCard snapshot={share.snapshot}/><section><h1 className="text-[27px] leading-[1.6] md:text-[34px]">{t.publicHeading}</h1><p className="mt-4 text-[13px] leading-[2] text-mist">{t.publicDescription}</p><ShareQuizLink token={token} locale={locale} href={href(locale,"/quiz")} className="pill mt-7 flex">{t.start}</ShareQuizLink><p className="mt-4 text-[11px] leading-[1.9] text-mist">{t.freeNote}</p><a className="text-link mt-5 text-[12px]" href={href(locale,"/help")}>{t.help}</a><div className="mt-9 border-t border-line pt-7"><p className="eyebrow text-mist">{t.pairTitle}</p><p className="mt-3 text-[13px] leading-[2] text-mist">{t.pairBody}</p><a className="text-link mt-3 text-[12px]" href={href(locale,"/pairing")}>{t.pairLink}</a></div></section></div><ShareVisit token={token} locale={locale}/>{env().WECHAT_SHARE_ENABLED === "true" && <WeChatShare title={t.title} desc={t.publicDescription} link={appUrl()+href(locale,`/s/${token}`)} imgUrl={appUrl()+href(locale,`/s/${token}/opengraph-image`)} />}</main></>;
}
