import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { Radar } from "@/components/result/radar";
import { TypeName } from "@/components/result/type-name";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Locale } from "@/lib/i18n/locale";
import { reportMessages } from "@/lib/i18n/messages/report";
import { getLocale } from "@/lib/i18n/server";
import { type Profile } from "@/lib/personality";
import type { Insight, Need } from "@/lib/report-content";
import { ChapterFooterNav, ChapterPanel, ChapterSidebarNav, ChapterTabs, StrengthSwitch } from "./chapter-ui";
import { PracticeCheck, PracticeProgress } from "./practice-check";

export type ReportData = {
  profile: Profile;
  name: string;
  line: string;
  summary: string;
  typeLabel: string;
  sample: boolean;
  demo: boolean;
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
export async function ReportBody({ data, reportKey, banner, footer, relationshipAction }: { data: ReportData; reportKey: string; banner?: ReactNode; footer?: ReactNode; relationshipAction?: ReactNode }) {
  const locale = await getLocale();
  const t = reportMessages[locale].aside;
  const { name, sample, demo, typeLabel, profile } = data;

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
              {t.unlocked(demo)}
            </Badge>
          )}
          <ChapterSidebarNav />
        </div>
      </aside>

      <article className="min-w-0">
        <div className="bg-night px-6 pt-6 text-paper md:hidden">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-3">
              <MirrorMark profile={profile} tone="paper" size={32} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{typeLabel}</span>
                <TypeName name={name} className="block text-xs text-night-body" />
              </span>
            </span>
            <span className="shrink-0 text-xs text-night-body">{t.mobileLabel(sample, demo)}</span>
          </div>
          <ChapterTabs />
        </div>

        <ChapterPanel index={0}>
          <Cover index={0} type={typeLabel} locale={locale} heading={reportMessages[locale].one.heading} as="h1" lead={reportMessages[locale].one.lead} />
          <Reading><ChapterOne data={data} locale={locale} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={1}>
          <Cover index={1} type={typeLabel} locale={locale} heading={reportMessages[locale].two.heading} />
          <Reading><ChapterTwo data={data} locale={locale} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={2} after={relationshipAction ? <div className="px-6 md:px-0">{relationshipAction}</div> : undefined}>
          <Cover index={2} type={typeLabel} locale={locale} heading={reportMessages[locale].three.heading} lead={reportMessages[locale].three.lead} />
          <Reading><ChapterThree data={data} locale={locale} /></Reading>
        </ChapterPanel>
        <ChapterPanel index={3}>
          <Cover index={3} type={typeLabel} locale={locale} heading={reportMessages[locale].four.heading} lead={reportMessages[locale].four.lead} />
          <Reading><ChapterFour data={data} locale={locale} reportKey={reportKey} /></Reading>
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

/** The chapter's dark cover: label, heading and an optional lead. Chapter 01 owns the page's `h1`. */
function Cover({ index, type, locale, heading, lead, as = "h2" }: { index: number; type: string; locale: Locale; heading: string; lead?: string; as?: "h1" | "h2" }) {
  const Tag = as;
  return (
    <header className="bg-night px-6 pt-2 pb-9 text-paper md:px-10 md:pt-9 md:pb-11 xl:px-12">
      <div className="mb-6 flex justify-between text-xs tracking-widest text-night-mist md:mb-8">
        <span>{reportMessages[locale].nav.chapter(index)}</span>
        <span>{type}</span>
      </div>
      <Tag className="text-3xl leading-heading md:text-4xl">{heading}</Tag>
      {lead && <p className="mt-5 max-w-xl text-base text-night-body">{lead}</p>}
    </header>
  );
}

function Reading({ children }: { children: ReactNode }) {
  return <div className="px-6 pt-8 pb-4 md:px-0 md:pt-10">{children}</div>;
}

function ChapterOne({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].one;
  const { profile, needs } = data;
  return (
    <>
      <div className="bg-card p-5 md:p-6">
        <Radar profile={profile} height={260} />
      </div>
      <h2 className="mt-10 text-xl leading-heading">{t.needsHeading}</h2>
      <ol className="mt-4 border-t border-line">
        {needs.map((need) => (
          <li key={need.letter} className="border-b border-line py-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-lg font-medium">{need.label} <span className="text-mist">{need.letter}</span></p>
              <p className={cn("text-sm", need.balanced ? "text-warm-ink" : "text-mist")}>{need.value}% · {need.degree}</p>
            </div>
            <Progress value={need.value} max={100} className="mt-3" indicatorClassName="bg-warm" aria-label={`${need.label} ${need.value}%`} />
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
      <Body>{t.body}</Body>
    </>
  );
}

function ChapterTwo({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].two;
  return (
    <>
      <StrengthSwitch strengths={<InsightList items={data.strengths} />} blindspots={<InsightList items={data.blindspots} />} />
      <Quote>{t.quote}</Quote>
    </>
  );
}

function ChapterThree({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].three;
  return (
    <>
      <InsightList items={data.relationships} variant="cards" />
      <Quote>{t.quote}</Quote>
      <Body>{t.body}</Body>
    </>
  );
}

function ChapterFour({ data, locale, reportKey }: ChapterProps & { reportKey: string }) {
  const t = reportMessages[locale].four;
  return (
    <>
      <InsightList items={data.work} />
      <h3 className="mt-12 text-2xl leading-heading">{t.weekHeading}</h3>
      <p className="mt-3 text-base text-slate">{t.weekIntro}</p>
      <ol className="mt-6 border-t border-line">
        {data.actionPlan.map((item, i) => (
          <li key={item.title} className="flex gap-4 border-b border-line py-5">
            <PracticeCheck reportKey={reportKey} day={i + 1} label={t.dayDone(item.title)} />
            <div className="min-w-0">
              <h4 className="text-base font-medium">{item.title}</h4>
              <p className="mt-2 text-base text-slate">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3"><PracticeProgress reportKey={reportKey} total={data.actionPlan.length} /></div>
      <div className="warm-panel my-10 p-6 md:p-8">
        <p className="eyebrow">{t.stepEyebrow}</p>
        <p className="mt-4 text-2xl leading-heading whitespace-pre-line">{t.stepHeading}</p>
        <p className="mt-4 text-sm whitespace-pre-line">{t.stepQuestions}</p>
      </div>
      <Body>{t.closing}</Body>
    </>
  );
}

function InsightList({ items, variant = "lines" }: { items: Insight[]; variant?: "lines" | "cards" }) {
  return (
    <div className={cn(variant === "cards" ? "space-y-3" : "border-t border-line")}>
      {items.map((item, i) => (
        <section key={item.title} className={cn(
          "flex gap-4",
          variant === "lines" && "border-b border-line py-6 md:gap-5",
          variant === "cards" && "bg-card p-5 md:p-6",
        )}>
          <span aria-hidden className="pt-1 text-xs text-warm-ink">0{i + 1}</span>
          <div className="min-w-0">
            <h3 className="text-base font-medium">{item.title}</h3>
            <p className="mt-2 text-base text-slate">{item.body}</p>
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
