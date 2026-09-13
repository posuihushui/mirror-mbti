import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { Radar } from "@/components/result/radar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
export function ReportBody({ data, banner, footer }: { data: ReportData; banner?: ReactNode; footer?: ReactNode }) {
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
      <aside className="hidden md:sticky md:top-[35px] md:block md:pt-[15px]">
        <p className="eyebrow text-[9px] text-[#758289]">YOUR INNER WORLD</p>
        <div className="mt-[26px] text-[64px] font-medium tracking-[-0.06em]">{typeLabel}</div>
        <p className="mt-1 text-[12px] text-[#75828a]">
          {name} · {sample ? "示例" : "本次"}人格报告
        </p>
        {sample ? (
          <Badge className="mt-[18px]">示例报告</Badge>
        ) : (
          <Badge variant="unlocked" className="mt-[18px]">
            <Check size={12} />
            已解锁{demo ? " · 演示" : ""}
          </Badge>
        )}
        <ChapterSidebarNav />
        <p className="mt-20 text-[9px] tracking-[0.1em] text-[#8b999f] whitespace-pre-line">{"YOU ARE MORE\nTHAN FOUR LETTERS."}</p>
      </aside>

      <article className="bg-night px-[25px] pt-[25px] pb-[55px] text-[#eff2f4] md:p-[35px] xl:px-[50px] xl:py-11">
        <div className="mb-[18px] flex justify-between text-[9px] text-[#a5b5bc] md:hidden">
          <span>
            {typeLabel} · {name}
          </span>
          <span>{sample ? "示例报告" : `完整报告${demo ? " · 演示" : ""}`}</span>
        </div>
        <ChapterTabs />

        <ChapterPanel index={0}>
          <ChapterLabel index={0} type={typeLabel} />
          <ChapterOne data={data} heading="h1" />
        </ChapterPanel>
        <ChapterPanel index={1}>
          <ChapterLabel index={1} type={typeLabel} />
          <ChapterTwo data={data} />
        </ChapterPanel>
        <ChapterPanel index={2}>
          <ChapterLabel index={2} type={typeLabel} />
          <ChapterThree data={data} />
        </ChapterPanel>
        <ChapterPanel index={3}>
          <ChapterLabel index={3} type={typeLabel} />
          <ChapterFour data={data} />
        </ChapterPanel>

        <ChapterFooterNav sample={sample} />
      </article>
      {footer ? <div className="mt-4 md:col-span-2 md:mt-10">{footer}</div> : null}
    </main>
  );
}

function ChapterOne({ data, heading = "h2" }: { data: ReportData; heading?: "h1" | "h2" }) {
  const { profile, line, summary } = data;
  const letters = profile.type.split("");
  return (
    <>
      <ChapterHeading as={heading}>{line}</ChapterHeading>
      <p className="mt-5 text-[13px] leading-[2.25] text-[#a9b5b9] md:mt-[22px] md:leading-[2.15]">{summary}</p>
      <div className="my-7 bg-[#eaf0f2] p-5 text-[#182126] md:mt-[35px] md:mb-[27px] md:p-[22px]">
        <Radar profile={profile} height={260} className="mb-[25px]" />
        <div>
          {letters.map((l, i) => (
            <div key={l} className="not-first:mt-[22px]">
              <div className="flex items-center justify-between text-[12px]">
                <b className="font-medium">
                  {dimensionReading(profile, i).label}
                </b>
                <span>{profile.values[i]}%</span>
              </div>
              <Progress
                value={profile.values[i]}
                max={100}
                className="mt-[9px]"
                indicatorClassName="bg-[#b89273]"
                aria-label={`${dimensionReading(profile, i).label} ${profile.values[i]}%`}
              />
              <p className="mt-[6px] text-[12px] leading-[1.9] text-[#73858c]">
                {dimensionReading(profile, i).interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Quote>{"你不需要符合一个类型，\n你只需要更了解自己。"}</Quote>
      <Body>这些倾向来自你本次的回答。环境、角色和最近的经历，都可能影响你的表达方式。把它当作观察自己的起点，看看哪些描述与你的生活相呼应。</Body>
    </>
  );
}

function ChapterTwo({ data }: { data: ReportData }) {
  return (
    <>
      <ChapterHeading>{"理解你的优势，\n也温柔地看见盲点。"}</ChapterHeading>
      <StrengthSwitch strengths={<InsightList items={data.strengths} />} blindspots={<InsightList items={data.blindspots} />} />
      <Quote>{"优势不需要时时在线。\n适合自己的节奏，同样重要。"}</Quote>
    </>
  );
}

function ChapterThree({ data }: { data: ReportData }) {
  return (
    <>
      <ChapterHeading>{"好的关系，\n从被理解开始。"}</ChapterHeading>
      <Lead>把“你应该懂我”，换成一次更具体的表达。你的偏好值得被看见，对方的也一样。</Lead>
      <InsightList items={data.relationships} />
      <Quote>{"“这件事让我感到……\n我希望我们可以……”"}</Quote>
      <Body>试着在一次小分歧中使用这句话。描述具体情境和自己的需要，避免用人格标签解释对方的一切。</Body>
    </>
  );
}

function ChapterFour({ data }: { data: ReportData }) {
  return (
    <>
      <ChapterHeading>{"找到适合你的方式，\n让成长具体一点。"}</ChapterHeading>
      <Lead>与其用人格类型决定职业，不如观察：什么环境能让你稳定发挥，什么习惯值得调整。</Lead>
      <InsightList items={data.work} />
      <h3 className="mt-9 text-[20px]">把理解放进一周生活里。</h3>
      <p className="mt-3 text-[12px] leading-[2] text-[#a9b7bc]">每天只做一个小尝试。以下安排根据本次四维作答选择，不是效果保证；不符合你的部分可以跳过或调整。</p>
      <InsightList items={data.actionPlan} />
      <div className="my-[33px] bg-[#243034] p-[25px]">
        <p className="eyebrow text-[9px] text-[#b1bfc4]">A SMALL STEP THIS WEEK</p>
        <p className="mt-5 text-[20px] leading-[1.7] font-normal whitespace-pre-line md:text-[21px]">{"记录一次让你感到\n“这很像我”的时刻。"}</p>
        <p className="mt-[15px] text-[11px] text-[#a9b7bc] whitespace-pre-line">{"当时你在做什么？和谁在一起？\n哪一个需要被满足了？"}</p>
      </div>
      <Body>一周后再回看这段记录。真实的生活体验，比任何四个字母都更能帮助你理解自己。</Body>
    </>
  );
}

function ChapterLabel({ index, type }: { index: number; type: string }) {
  return (
    <div className="mb-[23px] flex justify-between text-[9px] tracking-[0.12em] text-[#95a5a9] md:mb-[31px]">
      <span>CHAPTER 0{index + 1}</span>
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
