import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import portrait from "@/assets/portrait.jpg";
import portraitZh from "@/assets/portrait-zh.jpg";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { OverlayButton } from "@/components/site/overlay-button";
import { StartButton } from "@/components/site/start-button";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href, htmlLang, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { organizationId, pageMetadata } from "@/lib/seo";
import { siteCopy } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = siteCopy(locale);
  return pageMetadata({ locale, title: copy.title, description: copy.description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = pageMessages[locale].home;
  const copy = siteCopy(locale);
  const url = appUrl();
  // Mirrors only facts visible on this page: the test and the overview are free, and nothing here is sold.
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: copy.name,
    url: `${url}${locale === "zh" ? "" : href(locale, "/")}`,
    description: copy.description,
    inLanguage: htmlLang[locale],
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    publisher: { "@id": organizationId(url) },
    offers: [{ "@type": "Offer", name: t.freeOffer, price: "0", priceCurrency: pageMessages[locale].result.currencyCode }],
  };
  return (
    <>
      <AppHeader variant="home" />
      <main className="md:mx-auto md:max-w-[1320px] md:px-11">
        <section className="relative block h-svh min-h-[720px] bg-[#e8eff1] md:grid md:bg-transparent md:h-[calc(100dvh-228px)] md:max-h-[790px] md:min-h-[630px] md:grid-cols-[1.12fr_1fr] md:gap-5 2xl:grid-cols-[1.1fr_1fr]">
          <div className="absolute inset-x-0 top-[220px] bottom-0 overflow-hidden md:relative md:col-start-2 md:row-start-1 md:mt-7 md:inset-auto">
            <Image
              src={locale === "zh" ? portraitZh : portrait}
              alt={t.portraitAlt}
              fill
              priority
              quality={82}
              sizes="(max-width: 720px) 100vw, 45vw"
              placeholder="blur"
              className="home-portrait-motion object-cover object-[48%_35%] md:object-[50%_50%]"
            />
            {/* Desktop captions sit on the photo; a short ink fade keeps them legible without dimming the portrait above. */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-[160px] bg-[linear-gradient(to_top,#1217188c,#1217186b_30px,#12171826_90px,#12171800)] md:block" />
            <div className="absolute right-[30px] bottom-[27px] left-[30px] hidden items-center justify-between gap-[10px] text-[10px] tracking-[0.06em] text-paper md:flex">
              <span className="text-[9px] tracking-[0.14em]">{t.caption}</span>
              <span>{t.closer}</span>
            </div>
          </div>

          {/* Phones: the copy overlaps the portrait on short screens. A paper scrim hides the photo's top edge (220px),
              eases to 82% under the last line and fades out over 120px so the portrait rises out of the page. */}
          <div className="relative z-1 px-[27px] pt-[98px] before:absolute before:inset-x-0 before:top-0 before:-bottom-[120px] before:-z-1 before:bg-[linear-gradient(to_bottom,#e8eff1_220px,#e8eff1d1_calc(100%-120px),#e8eff19e_calc(100%-96px),#e8eff15c_calc(100%-68px),#e8eff124_calc(100%-36px),#e8eff100)] md:col-start-1 md:row-start-1 md:self-center md:px-0 md:pt-5 md:pb-[45px] md:before:hidden">
            <p className="eyebrow text-[8px] tracking-[0.17em] text-[#627176] md:text-[10px] md:tracking-[0.14em] md:text-ink">
              {t.eyebrow}
            </p>
            <h1 className="mt-[18px] text-[36px] leading-[1.4] tracking-[-0.055em] md:mt-[34px] md:text-[53px] md:leading-[1.32] md:tracking-[-0.065em] xl:text-[68px] 2xl:text-[77px]">
              <span className="home-title-motion inline-block">{t.titleLine1}</span>
              <br />
              <span className="home-title-motion home-title-motion-later inline-block">{t.titleLine2}<span className="text-warm">{t.titleStop}</span></span>
            </h1>
            <p className="home-description-motion mt-[17px] text-[12px] leading-[1.9] text-[#677276] md:mt-[26px] md:text-[14px] md:leading-[2]">
              {t.descLine1}
              <br />
              {t.descLine2}
            </p>
            <div className="mt-[17px] flex items-center gap-[13px] md:mt-[42px] md:gap-[14px] xl:gap-6">
              {t.stats.map(([n, l], i) => (
                <span
                  key={l}
                  className={
                    "flex items-center gap-1 text-[14px] font-medium whitespace-nowrap md:gap-[5px] md:text-[20px]" +
                    (i > 0 ? " border-l border-line pl-[13px] md:pl-[14px] xl:pl-6" : "")
                  }
                >
                  {n} <small className="text-[8px] font-normal text-[#5e7078] md:text-[11px] md:text-[#798286]">{l}</small>
                </span>
              ))}
            </div>
            <div className="mt-[41px] hidden grid-cols-[210px_1fr] items-center gap-x-4 gap-y-[13px] md:grid xl:grid-cols-[246px_1fr] xl:gap-x-7 xl:gap-y-3">
              <StartButton className="min-h-[58px]" trackLocation="hero" />
              <Link href={href(locale, "/result/sample")} className="text-link" {...trackAttrs("view_sample_result", "hero")}>
                {t.sampleLink} <ArrowUpRight size={16} />
              </Link>
              <p className="col-span-full mt-[2px] text-[10px] text-[#707c80]">{t.freeLine}</p>
            </div>
          </div>
          <p className="absolute bottom-[7px] left-0 hidden text-[10px] tracking-[0.04em] text-[#899498] md:block">{t.bottomLine}</p>
        </section>

        <section className="mt-8 hidden items-center justify-between gap-5 bg-night px-6 py-7 text-[11px] text-paper md:flex">
          <span className="text-[9px] tracking-[0.1em] text-[#91a0a5]">{t.stepsLabel}</span>
          {t.steps.map((s, i) => (
            <div key={s}>
              <b className="mr-3 font-normal text-warm">0{i + 1}</b> {s}
            </div>
          ))}
          <OverlayButton overlay="about" className="flex items-center gap-4 text-[11px] text-paper" {...trackAttrs("open_about", "steps_bar")}>
            {t.aboutLink} <ArrowUpRight size={15} />
          </OverlayButton>
        </section>
      </main>

      {/* The dock's price and sample link sit on the photo; a paper fade that deepens behind the button keeps them legible on any portrait. */}
      <Dock variant="home" className="before:absolute before:inset-0 before:-z-1 before:bg-[linear-gradient(to_bottom,#e8eff100,#e8eff140_30px,#e8eff199_60px,#e8eff1d9_86px,#e8eff1eb)]">
        <StartButton className="border-[3px] border-[#3e4343]" trackLocation="dock" />
        <div className="flex items-center justify-between px-[3px] pt-[11px] text-[8px] text-[#b7c4c7]">
          <span className="text-[9px] text-[#52656e]">{t.dockFree}</span>
          <PrimaryLink locale={locale} label={t.dockSample} />
        </div>
      </Dock>
      <JsonLd data={appJsonLd} />
    </>
  );
}

function PrimaryLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link href={href(locale, "/result/sample")} className="flex items-center gap-[3px] py-[2px] text-[9px] text-[#52656e]" {...trackAttrs("view_sample_result", "dock")}>
      {label}
      <ArrowUpRight size={12} />
    </Link>
  );
}
