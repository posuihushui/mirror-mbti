import type { ReactNode } from "react";
import { ArrowRight, CaretDown, Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { Illustration, type Scene } from "@/components/illustrations/scene";
import { poleScenes } from "@/components/illustrations/pole-scenes";
import { pairScene, relationshipScenes } from "@/components/illustrations/moment-scenes";
import { typeScenes } from "@/components/illustrations/type-scenes";
import { Radar } from "@/components/result/radar";
import { TypeName } from "@/components/result/type-name";
import { InfoTip } from "@/components/site/info-tip";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/locale";
import { reportMessages } from "@/lib/i18n/messages/report";
import { getLocale } from "@/lib/i18n/server";
import { isPersonalityType, type Letter, type Profile } from "@/lib/personality";
import type { Insight, Need } from "@/lib/report-content";
import { ChapterFooterNav, ChapterJump, ChapterPanel, ChapterSidebarNav, ChapterTabs, StrengthSwitch } from "./chapter-ui";
import type { GuideState } from "./chapter-ui";
import { GUIDE_TAB, reportTabLabelsFor } from "@/lib/site";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PracticeCheck, PracticeProgress, WeekStrip } from "./practice-check";
import { ClarityMeter, LeanBands, LeanBandsLegend, PairDots, StrengthBlindspotChart } from "./report-charts";
import { ContinueReading } from "./continue-reading";
import { ReportImage } from "./report-image";
import { href } from "@/lib/i18n/locale";

export type ReportData = {
  profile: Profile;
  name: string;
  line: string;
  summary: string;
  typeLabel: string;
  sample: boolean;
  needs: Need[];
  strengths: Insight[];
  blindspots: Insight[];
  relationships: Insight[];
  work: Insight[];
  actionPlan: Insight[];
};

/**
 * The detailed report. The public sample renders this exact layout with sample data —
 * there is no second reading view. All four chapters are rendered on the server and
 * shipped in the HTML; the client only decides which one is visible.
 *
 * Each chapter opens on a dark cover (label, heading, lead) that continues the tabs above it,
 * then the reading itself sits on paper, where long text is easiest to read.
 */
/**
 * The guide for two is the report's fifth tab (`GUIDE_TAB`): its own cover and `content` (the paid
 * report's invitations, or the sample's value-only preview). The sidebar only navigates to it, and
 * chapter 03, where relationships are read, ends with one line that opens it.
 */
export type ReportGuide = { state: GuideState; heading: string; lead: string; content: ReactNode };

export async function ReportBody({ data, reportKey, banner, footer, guide }: { data: ReportData; reportKey: string; banner?: ReactNode; footer?: ReactNode; guide: ReportGuide }) {
  const locale = await getLocale();
  const t = reportMessages[locale].aside;
  const { name, sample, typeLabel, profile } = data;
  const image = href(locale, `/report/${reportKey}/image`);

  return (
    <main
      className={cn(
        "block md:mx-auto md:grid md:max-w-[1100px] md:grid-cols-[200px_minmax(0,720px)] md:items-start md:gap-x-10 md:px-8 md:pt-10 md:pb-20 xl:grid-cols-[220px_minmax(0,720px)] xl:gap-x-16",
        // the sample carries a fixed dock on phones, so the last block needs room above it
        sample && "pb-[110px] md:pb-20",
      )}
    >
      {banner ? <div className="md:col-span-2">{banner}</div> : null}
      {/* Stretch the sidebar cell to the reading row so sticky content stops before the footer. */}
      <aside className="hidden md:block md:self-stretch">
        <div className="md:sticky md:top-9 md:pt-4">
          <p className="eyebrow text-mist">{t.eyebrow}</p>
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-6xl font-medium tracking-tighter">{typeLabel}</div>
            <MirrorMark profile={profile} size={56} className="shrink-0" />
          </div>
          <p className="mt-2 text-sm text-mist"><TypeName name={t.reportOf(name, sample)} /></p>
          {sample ? (
            <Badge className="mt-4">{t.sampleBadge}</Badge>
          ) : (
            <Badge variant="unlocked" className="mt-4">
              <Check size={12} />
              {t.unlocked}
            </Badge>
          )}
          <ChapterSidebarNav guide={guide.state} />
          <ReportImage src={image} className="mt-8" />
        </div>
      </aside>

      <article className="min-w-0">
        <div className="px-6 md:px-0"><ContinueReading reportKey={reportKey} /></div>
        <div className="bg-night px-6 pt-6 text-paper md:hidden">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-3">
              <MirrorMark profile={profile} tone="paper" size={32} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{typeLabel}</span>
                <TypeName name={name} className="block text-xs text-night-body" />
              </span>
            </span>
            <span className="shrink-0 text-xs text-night-body">{t.mobileLabel(sample)}</span>
          </div>
          <ChapterTabs guide={guide.state} />
        </div>

        <ChapterPanel index={0}>
          <Cover index={0} type={typeLabel} locale={locale} heading={reportMessages[locale].one.heading} as="h1" lead={reportMessages[locale].one.lead} scene={isPersonalityType(profile.type) ? typeScenes[profile.type] : undefined} />
          <Reading>
            <ChapterOne data={data} locale={locale} />
            {/* Phones keep the image here; desktop has it under the chapter list. */}
            <ReportImage src={image} className="mt-8 md:hidden" />
          </Reading>
        </ChapterPanel>
        <ChapterPanel index={1}>
          <Cover index={1} type={typeLabel} locale={locale} heading={reportMessages[locale].two.heading} scene={poleScenes[clearestLetter(profile)]} />
          <Reading><ChapterTwo data={data} locale={locale} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={2} after={<div className="px-6 md:px-0"><GuidePointer state={guide.state} locale={locale} /></div>}>
          <Cover index={2} type={typeLabel} locale={locale} heading={reportMessages[locale].three.heading} lead={reportMessages[locale].three.lead} scene={pairScene} />
          <Reading><ChapterThree data={data} locale={locale} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={3}>
          <Cover index={3} type={typeLabel} locale={locale} heading={reportMessages[locale].four.heading} lead={reportMessages[locale].four.lead} scene={relationshipScenes.colleague} />
          <Reading><ChapterFour data={data} locale={locale} reportKey={reportKey} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={GUIDE_TAB}>
          <Cover index={GUIDE_TAB} label={reportTabLabelsFor(locale)[GUIDE_TAB]} type={typeLabel} locale={locale} heading={guide.heading} lead={guide.lead} scene={pairScene} />
          <div data-report-guide={guide.state} className="px-6 pt-8 pb-4 md:px-0 md:pt-10">{guide.content}</div>
        </ChapterPanel>

        <div className="px-6 md:px-0">
          <ChapterFooterNav sample={sample} />
        </div>
      </article>
      {footer ? <div className="mt-4 md:col-span-2 md:mt-10">{footer}</div> : null}
    </main>
  );
}

type ChapterProps = { data: ReportData; locale: Locale };

/** The letter this result leans on most clearly: chapter 02's cover shows its everyday picture. */
function clearestLetter(profile: Profile) {
  const index = profile.values.reduce((best, value, i) => (value > profile.values[best] ? i : best), 0);
  return profile.type[index] as Letter;
}

/**
 * Chapter 03's last word: the guide for two, in one line that opens its tab. It names where the
 * reader's guide stands; the sample's names what a guide is, with no price and nothing to buy.
 */
function GuidePointer({ state, locale }: { state: GuideState; locale: Locale }) {
  const t = pairingUiMessages[locale].reportInvite;
  const line = state === "sample" ? pairingMessages[locale].summary : (state === "start" ? t.headings.relationship : t.headings[state]).replace("\n", "");
  return (
    <section data-guide-pointer className="my-10 flex flex-col gap-4 bg-card p-5 md:flex-row md:items-center md:justify-between md:gap-8 md:p-6">
      <div className="flex min-w-0 items-center gap-4">
        <Illustration scene={pairScene} className="w-16 shrink-0" />
        <p className="min-w-0 text-base">
          <span className="block text-xs text-warm-ink">{reportTabLabelsFor(locale)[GUIDE_TAB]}</span>
          <span className="mt-1 block font-medium">{line}</span>
        </p>
      </div>
      <ChapterJump index={GUIDE_TAB} className="pill min-h-11 shrink-0 px-5 text-sm md:w-auto">
        {reportMessages[locale].nav.openGuide}
        <ArrowRight size={17} weight="light" aria-hidden />
      </ChapterJump>
    </section>
  );
}

/** The chapter's dark cover: label, heading beside the chapter's picture, and an optional lead. Chapter 01 owns the page's `h1`. */
function Cover({ index, label, type, locale, heading, lead, scene, as = "h2" }: { index: number; label?: string; type: string; locale: Locale; heading: string; lead?: string; scene?: Scene; as?: "h1" | "h2" }) {
  const Tag = as;
  return (
    <header className="bg-night px-6 pt-2 pb-9 text-paper md:px-10 md:pt-9 md:pb-11 xl:px-12">
      <div className="mb-6 flex justify-between text-xs tracking-widest text-night-mist md:mb-8">
        <span>{label ?? reportMessages[locale].nav.chapter(index)}</span>
        <span>{type}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Tag className="min-w-0 text-3xl leading-heading md:text-4xl">{heading}</Tag>
        {scene && <Illustration scene={scene} tone="night" className="w-24 shrink-0 md:w-40" />}
      </div>
      {lead && <p className="mt-5 max-w-xl text-base text-night-body">{lead}</p>}
    </header>
  );
}

function Reading({ children }: { children: ReactNode }) {
  return <div className="px-6 pt-8 pb-4 md:px-0 md:pt-10">{children}</div>;
}

/** A passage's heading with the lean it reads from, drawn as a meter instead of an opening sentence. */
function InsightHead({ item, index, as: Tag = "h3" }: { item: Insight; index?: number; as?: "h3" | "h4" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <Tag className="flex gap-3 text-base font-medium">
        {index !== undefined && <span aria-hidden className="pt-0.5 text-xs text-warm-ink">0{index + 1}</span>}
        {item.title}
      </Tag>
      {item.dim && <ClarityMeter dim={item.dim} />}
    </div>
  );
}

function ChapterOne({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].one;
  const { profile, needs } = data;
  return (
    <>
      <div className="bg-card p-5 md:p-6">
        <Radar profile={profile} height={260} />
      </div>
      <div className="mt-10 flex items-center gap-2">
        <h2 className="text-xl leading-heading">{t.needsHeading}</h2>
        <InfoTip id="report-one-note" label={t.noteLabel} close={reportMessages[locale].tip}>
          <p>{t.body}</p>
        </InfoTip>
      </div>
      <div className="mt-3"><LeanBandsLegend locale={locale} /></div>
      <ol className="mt-4 border-t border-line">
        {needs.map((need) => (
          <li key={need.letter} className="border-b border-line py-6">
            <div className="flex items-center gap-3">
              <Illustration scene={poleScenes[need.letter as Letter]} className="w-14 shrink-0 md:w-16" />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <p className="text-lg font-medium">{need.label} <span className="text-mist">{need.letter}</span></p>
                <p className={cn("text-sm", need.balanced ? "text-warm-ink" : "text-mist")}>{need.value}% · {need.degree}</p>
              </div>
            </div>
            <LeanBands value={need.value} label={`${need.label} ${need.value}% · ${need.degree}`} className="mt-3" />
            {need.balanced ? (
              <div className="mt-4">
                <p className="eyebrow text-warm-ink">{t.bothLabel}</p>
                <ul className="mt-2 space-y-2">
                  {need.both.map((b) => <li key={b.label} className="text-base text-slate"><span className="font-medium text-ink">{b.label}</span>{locale === "en" ? ": " : "："}{b.strength}</li>)}
                </ul>
              </div>
            ) : (
              <dl className="mt-4 grid gap-x-6 gap-y-2 md:grid-cols-[7rem_minmax(0,1fr)]">
                <dt className="text-sm text-warm-ink">{t.strengthLabel}</dt>
                <dd className="text-base text-slate">{need.strength}</dd>
                <dt className="mt-2 text-sm text-warm-ink md:mt-0">{t.growthLabel}</dt>
                <dd className="text-base text-slate">{need.growth}</dd>
              </dl>
            )}
          </li>
        ))}
      </ol>
      <Quote>{t.quote}</Quote>
    </>
  );
}

function ChapterTwo({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].two;
  const nav = reportMessages[locale].nav;
  return (
    <>
      <StrengthBlindspotChart strengths={data.strengths} blindspots={data.blindspots} locale={locale} />
      {/* Phones switch between the two lists; from 721px they sit side by side, each strength next to its blind spot. */}
      <div className="mt-8 md:hidden">
        <StrengthSwitch strengths={<InsightList items={data.strengths} />} blindspots={<InsightList items={data.blindspots} />} />
      </div>
      <div className="mt-10 hidden md:grid md:grid-cols-2 md:gap-x-8" data-strength-columns>
        <h3 className="border-b border-ink pb-2 text-sm font-medium">{nav.strengths}</h3>
        <h3 className="border-b border-ink pb-2 text-sm font-medium">{nav.blindspots}</h3>
        {data.strengths.map((strength, i) => (
          <div key={strength.title} className="contents">
            <InsightRow item={strength} index={i} />
            <InsightRow item={data.blindspots[i]} index={i} />
          </div>
        ))}
      </div>
      <Quote>{t.quote}</Quote>
    </>
  );
}

function InsightRow({ item, index }: { item: Insight; index: number }) {
  return (
    <section className="border-b border-line py-6">
      <InsightHead item={item} index={index} as="h4" />
      <p className="mt-2 pl-7 text-base text-slate">{item.body}</p>
    </section>
  );
}

/**
 * Chapter 03: each card is a sentence to say, then the same moment between two people, drawn on the
 * dimension's line and pictured by its relationship. How to use the sentences is said once, above.
 */
function ChapterThree({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].three;
  return (
    <>
      <p className="mb-5 border-l-2 border-warm pl-4 text-sm text-slate">{t.howTo}</p>
      <div className="space-y-3">
        {data.relationships.map((item, i) => (
          <section key={item.title} className="bg-card p-5 md:p-6">
            <InsightHead item={item} index={i} />
            {item.body && <p className="mt-2 pl-7 text-sm text-slate">{item.body}</p>}
            {item.say && <p className="mt-4 rounded-[16px] rounded-bl-[4px] border border-line bg-paper px-4 py-3 text-lg leading-heading text-ink">“{item.say}”</p>}
            {item.pair && (
              <div data-pair-scene className="mt-5 flex gap-4 border-t border-line pt-4">
                <Illustration scene={relationshipScenes[item.pair.relationship]} className="w-20 shrink-0 self-start md:w-24" />
                <div className="min-w-0 flex-1">
                  {/* The guide for two's legend: you a filled dot, the other a warm ring. */}
                  <p className="flex items-center gap-2 text-xs text-warm-ink">
                    <span aria-hidden className="flex shrink-0 gap-1"><span className="size-2 rounded-full bg-ink" /><span className="size-2 rounded-full border border-warm-ink" /></span>
                    {item.pair.label}
                  </p>
                  {item.dim && <PairDots dim={item.dim} balanced={item.pair.balanced} locale={locale} />}
                  <p className="mt-1 text-base text-ink">{item.pair.scene}</p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
      <Quote>{t.quote}</Quote>
      <Body>{t.body}</Body>
    </>
  );
}

function ChapterFour({ data, locale, reportKey }: ChapterProps & { reportKey: string }) {
  const t = reportMessages[locale].four;
  return (
    <>
      <InsightList items={data.work} pictured />
      <div className="mt-12 flex items-center gap-2">
        <h3 className="text-2xl leading-heading">{t.weekHeading}</h3>
        <InfoTip id="report-week-note" label={t.weekNoteLabel} close={reportMessages[locale].tip}>
          <p>{t.weekIntro}</p>
        </InfoTip>
      </div>
      <div className="mt-6"><WeekStrip reportKey={reportKey} total={data.actionPlan.length} /></div>
      <div className="mt-3"><PracticeProgress reportKey={reportKey} total={data.actionPlan.length} /></div>
      {/* Each day shows what it is; how to do it folds under the title (the first day opens). */}
      <ol className="mt-5 border-t border-line">
        {data.actionPlan.map((item, i) => (
          <li key={item.title} className="flex gap-4 border-b border-line py-4">
            <PracticeCheck reportKey={reportKey} day={i + 1} label={t.dayDone(item.title)} />
            <div className="min-w-0 flex-1">
              <h4 className="pt-0.5 text-base font-medium">{item.title}</h4>
              <details className="group" open={i === 0}>
                <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-xs text-mist [&::-webkit-details-marker]:hidden">
                  {t.how}<CaretDown size={12} aria-hidden className="transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-1 text-base text-slate">{item.body}</p>
              </details>
            </div>
          </li>
        ))}
      </ol>
      <div className="warm-panel my-10 p-6 md:p-8">
        <p className="eyebrow">{t.stepEyebrow}</p>
        <p className="mt-4 text-2xl leading-heading whitespace-pre-line">{t.stepHeading}</p>
        <p className="mt-4 text-sm whitespace-pre-line">{t.stepQuestions}</p>
      </div>
      <Body>{t.closing}</Body>
    </>
  );
}

/** A list of passages, each headed by its lean; `pictured` leads each with its pole's everyday picture instead of a number. */
function InsightList({ items, pictured = false }: { items: Insight[]; pictured?: boolean }) {
  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <section key={item.title} className="flex gap-4 border-b border-line py-6 md:gap-5">
          {pictured && item.dim && <Illustration scene={poleScenes[item.dim.letter as Letter]} className="w-14 shrink-0 self-start md:w-16" />}
          <div className="min-w-0 flex-1">
            <InsightHead item={item} index={pictured ? undefined : i} />
            {item.body && <p className={cn("mt-2 text-base text-slate", !pictured && "pl-7")}>{item.body}</p>}
          </div>
        </section>
      ))}
    </div>
  );
}

function Quote({ children }: { children: string }) {
  return (
    <blockquote className="my-10 border-l-2 border-warm py-1 pl-5 text-xl leading-heading whitespace-pre-line text-ink md:text-2xl">
      {children}
    </blockquote>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-base text-slate">{children}</p>;
}
