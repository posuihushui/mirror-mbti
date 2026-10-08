import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MirrorMark } from "@/components/brand/mirror-mark";
import portrait from "@/assets/portrait.jpg";
import portraitZh from "@/assets/portrait-zh.jpg";
import { AppHeader } from "@/components/site/app-header";
import { Dock } from "@/components/site/dock";
import { OverlayButton } from "@/components/site/overlay-button";
import { StartButton } from "@/components/site/start-button";
import { TextLink } from "@/components/site/text-link";
import { JsonLd } from "@/components/seo/json-ld";
import { trackAttrs, type TrackAttrs } from "@/lib/analytics/events";
import { appUrl } from "@/lib/env";
import { href, htmlLang, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { organizationId, pageMetadata } from "@/lib/seo";
import { sampleProfile, typeMeta, type Profile } from "@/lib/personality";
import { latestResultForVisitor } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { siteCopy } from "@/lib/site";
import { TypeName } from "@/components/result/type-name";

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
  // Mirrors only facts visible on this page: the test is free (the dock's 免费测试), and nothing here is sold.
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
            {/* Desktop: what a result looks like, on the photo, clear of the face (she looks right in Chinese, left in English). */}
            <Suspense fallback={<ResultCard locale={locale} {...sampleEntry(locale).card} className={cardSide(locale)} />}>
              <HomeCard locale={locale} />
            </Suspense>
          </div>

          {/* Phones: the copy overlaps the portrait on short screens. A paper scrim hides the photo's top edge (220px),
              eases to 82% under the last line and fades out over 120px so the portrait rises out of the page. */}
          <div className="relative z-1 px-[27px] pt-[98px] before:absolute before:inset-x-0 before:top-0 before:-bottom-[120px] before:-z-1 before:bg-[linear-gradient(to_bottom,#e8eff1_220px,#e8eff1d1_calc(100%-120px),#e8eff19e_calc(100%-96px),#e8eff15c_calc(100%-68px),#e8eff124_calc(100%-36px),#e8eff100)] md:col-start-1 md:row-start-1 md:self-center md:px-0 md:pt-5 md:pb-[45px] md:before:hidden">
            <p className="eyebrow text-mist md:text-ink">
              {t.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl leading-[1.3] md:mt-8 md:text-5xl md:leading-[1.25] xl:text-[68px] 2xl:text-[76px]">
              <span className="home-title-motion inline-block">{t.titleLine1}</span>
              <br />
              <span className="home-title-motion home-title-motion-later inline-block">{t.titleLine2}<span className="text-warm">{t.titleStop}</span></span>
            </h1>
            <p className="home-description-motion mt-4 text-sm text-mist md:mt-6 md:text-base">
              {t.descLine1}
              <br />
              {t.descLine2}
            </p>
            <div className="mt-4 flex items-center gap-3 md:mt-10 md:gap-4 xl:gap-6">
              {t.stats.map(([n, l], i) => (
                <span
                  key={l}
                  className={
                    "flex items-baseline gap-1 text-base font-medium whitespace-nowrap md:gap-1.5 md:text-xl" +
                    (i > 0 ? " border-l border-line pl-3 md:pl-4 xl:pl-6" : "")
                  }
                >
                  {n} <small className="text-xs font-normal text-mist">{l}</small>
                </span>
              ))}
            </div>
            <div className="mt-[41px] hidden grid-cols-[210px_1fr] items-center gap-x-4 gap-y-[13px] md:grid xl:grid-cols-[246px_1fr] xl:gap-x-7 xl:gap-y-3">
              <StartButton className="min-h-[58px]" trackLocation="hero" />
              <Suspense fallback={<HeroLink locale={locale} mine={false} />}>
                <HomeHeroLink locale={locale} />
              </Suspense>
            </div>
          </div>
          <p className="absolute bottom-2 left-0 hidden text-xs text-mist md:block">{t.bottomLine}</p>
        </section>

        <section className="mt-8 hidden items-center justify-between gap-5 bg-night px-6 py-6 text-sm text-paper md:flex">
          <span className="text-xs tracking-widest text-night-mist">{t.stepsLabel}</span>
          {t.steps.map((s, i) => (
            <div key={s}>
              <b className="mr-3 text-xs font-normal text-warm">0{i + 1}</b> {s}
            </div>
          ))}
          <OverlayButton overlay="about" className="flex min-h-11 items-center gap-3 text-sm text-paper" {...trackAttrs("open_about", "steps_bar")}>
            {t.aboutLink} <ArrowRight size={15} />
          </OverlayButton>
        </section>
      </main>

      {/* The dock's price and sample link sit on the photo; a paper fade that deepens behind the button keeps them legible on any portrait. */}
      <Dock variant="home" className="before:absolute before:inset-0 before:-z-1 before:bg-[linear-gradient(to_bottom,#e8eff100,#e8eff140_30px,#e8eff199_60px,#e8eff1d9_86px,#e8eff1eb)]">
        <StartButton className="border-[3px] border-[#3e4343]" trackLocation="dock" />
        <div className="flex items-center justify-between px-1 pt-2">
          <span className="text-xs text-[#52656e]">{t.dockFree}</span>
          <Suspense fallback={<ResultChip locale={locale} {...sampleEntry(locale).chip} />}>
            <HomeChip locale={locale} />
          </Suspense>
        </div>
      </Dock>
      <JsonLd data={appJsonLd} />
    </>
  );
}

/**
 * The visitor's newest result in this language, read once per request. The sample entries are only for
 * someone who has none yet: with a result, each of them leads to 我的报告 and shows that result instead.
 * The static shell keeps the sample, and a missing database leaves it in place.
 */
const newestOwnResult = cache(async (locale: Locale) => {
  const visitorId = await getVisitorId();
  return visitorId ? latestResultForVisitor(visitorId, locale).catch(() => null) : null;
});

type Entry = { profile: Profile; label: string; to: string; track: TrackAttrs };

function sampleEntry(locale: Locale) {
  const t = pageMessages[locale].home;
  const to = "/result/sample";
  return {
    card: { profile: sampleProfile, label: t.sampleCard, to, track: trackAttrs("view_sample_result", "home_sample") },
    chip: { profile: sampleProfile, label: t.dockSample, to, track: trackAttrs("view_sample_result", "dock") },
  } satisfies Record<string, Entry>;
}

function mineEntry(locale: Locale, profile: Profile) {
  const t = pageMessages[locale].home;
  const to = "/my/report";
  return {
    card: { profile, label: t.mineCard, to, track: trackAttrs("my_report", "home_sample") },
    chip: { profile, label: t.dockMine, to, track: trackAttrs("my_report", "dock") },
  } satisfies Record<string, Entry>;
}

/** She looks right in Chinese and left in English, so the card sits on the other side. */
const cardSide = (locale: Locale) => (locale === "en" ? "right-6" : "left-6");

async function HomeCard({ locale }: { locale: Locale }) {
  const own = await newestOwnResult(locale);
  const entry = own ? mineEntry(locale, own.profile) : sampleEntry(locale);
  return <ResultCard locale={locale} {...entry.card} className={cardSide(locale)} />;
}

async function HomeChip({ locale }: { locale: Locale }) {
  const own = await newestOwnResult(locale);
  return <ResultChip locale={locale} {...(own ? mineEntry(locale, own.profile) : sampleEntry(locale)).chip} />;
}

async function HomeHeroLink({ locale }: { locale: Locale }) {
  return <HeroLink locale={locale} mine={Boolean(await newestOwnResult(locale))} />;
}

function HeroLink({ locale, mine }: { locale: Locale; mine: boolean }) {
  const t = pageMessages[locale].home;
  return mine ? (
    <TextLink href={href(locale, "/my/report")} {...trackAttrs("my_report", "hero")}>{t.mineLink}</TextLink>
  ) : (
    <TextLink href={href(locale, "/result/sample")} {...trackAttrs("view_sample_result", "hero")}>{t.sampleLink}</TextLink>
  );
}

/** Phones: a result as a thing you can open — its small mirror and type, not a bare text link. */
function ResultChip({ locale, profile, label, to, track }: Entry & { locale: Locale }) {
  return (
    <Link href={href(locale, to)} className="flex min-h-8 items-center gap-1.5 text-xs text-[#52656e]" {...track}>
      <MirrorMark profile={profile} size={20} className="shrink-0" />
      {label}
      <b className="font-medium text-ink">{profile.type}</b>
      <ArrowRight size={13} />
    </Link>
  );
}

/** A small, real result on the photo: the sample's (what the test gives back) or the visitor's own. */
function ResultCard({ locale, profile, label, to, track, className }: Entry & { locale: Locale; className: string }) {
  const { name } = typeMeta(profile.type, locale);
  return (
    <Link
      href={href(locale, to)}
      className={`group absolute bottom-6 hidden w-[272px] bg-paper/90 p-5 text-ink shadow-[0_18px_40px_rgba(18,23,24,0.16)] backdrop-blur-md md:block ${className}`}
      {...track}
    >
      <span className="flex items-center justify-between">
        <span className="eyebrow text-mist">{label}</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="mt-3 flex items-center gap-4">
        <MirrorMark profile={profile} size={52} className="shrink-0" />
        <span className="min-w-0">
          <span className="block text-3xl leading-none font-medium tracking-tighter">{profile.type}</span>
          <TypeName name={name} className="mt-1.5 block text-xs text-mist" />
        </span>
      </span>
      <span className="mt-4 grid grid-cols-4 border-t border-line pt-3 text-center">
        {profile.type.split("").map((letter, i) => (
          <span key={letter} className="text-xs text-mist not-first:border-l not-first:border-line">
            <b className="block text-sm font-medium text-ink">{letter}</b>
            {profile.values[i]}%
          </span>
        ))}
      </span>
    </Link>
  );
}
