import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { Radar } from "@/components/result/radar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Locale } from "@/lib/i18n/locale";
import { reportMessages } from "@/lib/i18n/messages/report";
import { getLocale } from "@/lib/i18n/server";
import { type Profile } from "@/lib/personality";
import type { Insight } from "@/lib/report-content";
import { dimensionReading } from "@/lib/preference-content";
import { ChapterFooterNav, ChapterPanel, ChapterSidebarNav, ChapterTabs, StrengthSwitch } from "./chapter-ui";

export type ReportData = {
  profile: Profile;
  name: string;
  line: string;
  summary: string;
  typeLabel: string;
  sample: boolean;
  demo: boolean;
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
 */
export async function ReportBody({ data, banner, footer }: { data: ReportData; banner?: ReactNode; footer?: ReactNode }) {
  const locale = await getLocale();
  const t = reportMessages[locale].aside;
  const { name, sample, demo, typeLabel } = data;

  return (
    <main
      className={cn(
        "block md:mx-auto md:grid md:max-w-[1100px] md:grid-cols-[190px_minmax(0,720px)] md:items-start md:gap-x-[30px] md:px-[30px] md:pt-10 md:pb-[70px] xl:grid-cols-[220px_minmax(0,720px)] xl:gap-x-[68px]",
        // the sample carries a fixed dock on phones, so the last block needs room above it
        sample && "pb-[110px] md:pb-[70px]",
      )}
    >
      {banner ? <div className="md:col-span-2">{banner}</div> : null}
      {/* Stretch the sidebar cell to the reading row so sticky content stops before the footer. */}
      <aside className="hidden md:block md:self-stretch">
        <div className="md:sticky md:top-[35px] md:pt-[15px]">
          <p className="eyebrow text-[9px] text-[#758289]">{t.eyebrow}</p>
          <div className="mt-[26px] text-[64px] font-medium tracking-[-0.06em]">{typeLabel}</div>
          <p className="mt-1 text-[12px] text-[#75828a]">
            {t.reportOf(name, sample)}
          </p>
          {sample ? (
            <Badge className="mt-[18px]">{t.sampleBadge}</Badge>
          ) : (
            <Badge variant="unlocked" className="mt-[18px]">
              <Check size={12} />
              {t.unlocked(demo)}
            </Badge>
          )}
          <ChapterSidebarNav />
          <p className="mt-20 text-[9px] tracking-[0.1em] text-[#8b999f] whitespace-pre-line">{t.footnote}</p>
        </div>
      </aside>

      <article className="bg-night px-[25px] pt-[25px] pb-[55px] text-[#eff2f4] md:p-[35px] xl:px-[50px] xl:py-11">
        <div className="mb-[18px] flex justify-between text-[9px] text-[#a5b5bc] md:hidden">
          <span>
            {typeLabel} · {name}
          </span>
          <span>{t.mobileLabel(sample, demo)}</span>
        </div>
        <ChapterTabs />

        <ChapterPanel index={0}>
          <ChapterLabel index={0} type={typeLabel} locale={locale} />
          <ChapterOne data={data} locale={locale} heading="h1" />
        </ChapterPanel>
        <ChapterPanel index={1}>
          <ChapterLabel index={1} type={typeLabel} locale={locale} />
          <ChapterTwo data={data} locale={locale} />
        </ChapterPanel>
        <ChapterPanel index={2}>
          <ChapterLabel index={2} type={typeLabel} locale={locale} />
          <ChapterThree data={data} locale={locale} />
        </ChapterPanel>
        <ChapterPanel index={3}>
          <ChapterLabel index={3} type={typeLabel} locale={locale} />
          <ChapterFour data={data} locale={locale} />
        </ChapterPanel>

        <ChapterFooterNav sample={sample} />
      </article>
      {footer ? <div className="mt-4 md:col-span-2 md:mt-10">{footer}</div> : null}
    </main>
  );
}

type ChapterProps = { data: ReportData; locale: Locale };

function ChapterOne({ data, locale, heading = "h2" }: ChapterProps & { heading?: "h1" | "h2" }) {
  const t = reportMessages[locale].one;
  const { profile, line, summary } = data;
  const letters = profile.type.split("");
  return (
    <>
      <ChapterHeading as={heading}>{line}</ChapterHeading>
      <p className="mt-5 text-[13px] leading-[2.25] text-[#a9b5b9] md:mt-[22px] md:leading-[2.15]">{summary}</p>
      <div className="my-7 bg-[#eaf0f2] p-5 text-[#182126] md:mt-[35px] md:mb-[27px] md:p-[22px]">
        <Radar profile={profile} height={260} className="mb-[25px]" />
        <div>
          {letters.map((l, i) => {
            const reading = dimensionReading(profile, i, locale);
            return (
              <div key={l} className="not-first:mt-[22px]">
                <div className="flex items-center justify-between text-[12px]">
                  <b className="font-medium">
                    {reading.label}
                  </b>
                  <span>{profile.values[i]}%</span>
                </div>
                <Progress
                  value={profile.values[i]}
                  max={100}
                  className="mt-[9px]"
                  indicatorClassName="bg-[#b89273]"
                  aria-label={`${reading.label} ${profile.values[i]}%`}
                />
                <p className="mt-[6px] text-[12px] leading-[1.9] text-[#73858c]">
                  {reading.interpretation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <Quote>{t.quote}</Quote>
      <Body>{t.body}</Body>
    </>
  );
}

function ChapterTwo({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].two;
  return (
    <>
      <ChapterHeading>{t.heading}</ChapterHeading>
      <StrengthSwitch strengths={<InsightList items={data.strengths} />} blindspots={<InsightList items={data.blindspots} />} />
      <Quote>{t.quote}</Quote>
    </>
  );
}

function ChapterThree({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].three;
  return (
    <>
      <ChapterHeading>{t.heading}</ChapterHeading>
      <Lead>{t.lead}</Lead>
      <InsightList items={data.relationships} />
      <Quote>{t.quote}</Quote>
      <Body>{t.body}</Body>
    </>
  );
}

function ChapterFour({ data, locale }: ChapterProps) {
  const t = reportMessages[locale].four;
  return (
    <>
      <ChapterHeading>{t.heading}</ChapterHeading>
      <Lead>{t.lead}</Lead>
      <InsightList items={data.work} />
      <h3 className="mt-9 text-[20px]">{t.weekHeading}</h3>
      <p className="mt-3 text-[12px] leading-[2] text-[#a9b7bc]">{t.weekIntro}</p>
      <InsightList items={data.actionPlan} />
      <div className="my-[33px] bg-[#243034] p-[25px]">
        <p className="eyebrow text-[9px] text-[#b1bfc4]">{t.stepEyebrow}</p>
        <p className="mt-5 text-[20px] leading-[1.7] font-normal whitespace-pre-line md:text-[21px]">{t.stepHeading}</p>
        <p className="mt-[15px] text-[11px] text-[#a9b7bc] whitespace-pre-line">{t.stepQuestions}</p>
      </div>
      <Body>{t.closing}</Body>
    </>
  );
}

function ChapterLabel({ index, type, locale }: { index: number; type: string; locale: Locale }) {
  return (
    <div className="mb-[23px] flex justify-between text-[9px] tracking-[0.12em] text-[#95a5a9] md:mb-[31px]">
      <span>{reportMessages[locale].nav.chapter(index)}</span>
      <span>{type}</span>
    </div>
  );
}

/** Chapter 01 owns the report page's `h1`; everywhere else the chapters are `h2`. */
function ChapterHeading({ as = "h2", children }: { as?: "h1" | "h2"; children: string }) {
  const Tag = as;
  return <Tag className="text-[27px] leading-[1.6] tracking-[-0.03em] md:text-[31px]">{children}</Tag>;
}

function InsightList({ items }: { items: Insight[] }) {
  return (
    <>
      {items.map((item, i) => (
        <section key={item.title} className="flex gap-[13px] border-b border-night-line py-[25px] md:gap-5 md:py-7">
          <span className="pt-[5px] text-[9px] text-[#a38f7a]">0{i + 1}</span>
          <div>
            <h3 className="text-[15px] leading-[1.7] font-medium md:text-[14px]">{item.title}</h3>
            <p className="mt-[10px] text-[13px] leading-[2.1] text-[#a6b6bc] md:text-[12px]">{item.body}</p>
          </div>
        </section>
      ))}
    </>
  );
}

function Quote({ children }: { children: string }) {
  return (
    <blockquote className="my-[30px] border-l border-[#bc9c7f] py-[26px] pl-[15px] text-[20px] leading-[1.7] font-normal tracking-[-0.02em] whitespace-pre-line text-[#d4b99f] md:my-10 md:pl-5 md:text-[23px]">
      {children}
    </blockquote>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-[13px] leading-[2.25] text-[#a9b5b9] md:mt-[22px] md:leading-[2.15]">{children}</p>;
}

function Body({ children }: { children: ReactNode }) {
  return <p className="mt-[22px] text-[13px] leading-[2.15] text-[#a9b5b9] md:text-[12px]">{children}</p>;
}
