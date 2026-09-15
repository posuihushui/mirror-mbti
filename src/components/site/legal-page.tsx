import type { ReactNode } from "react";
import { AppHeader } from "@/components/site/app-header";
import { href } from "@/lib/i18n/locale";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getLocale } from "@/lib/i18n/server";

export async function LegalPage({ eyebrow, title, updated, path, children }: { eyebrow: string; title: string; updated: string; path: string; children: ReactNode }) {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={title} backHref={href(locale, "/")} path={path} />
      <main className="mx-auto max-w-[680px] px-[27px] pt-4 pb-20 md:px-10 md:pt-[60px]">
        <p className="eyebrow text-[#738087]">{eyebrow}</p>
        <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{title}</h1>
        <p className="mt-2 text-[10px] text-[#899498]">{siteMessages[locale].legal.updated(updated)}</p>
        <div className="mt-8 text-[13px] leading-[2] text-[#4f5c61] [&_h2]:mt-8 [&_h2]:text-[15px] [&_h2]:font-medium [&_h2]:text-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </>
  );
}
