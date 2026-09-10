"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react";
import { cn } from "cn";
import { Radar } from "@/components/result/radar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { poles, type Profile } from "@/lib/personality";
import type { Insight } from "@/lib/report-content";
import { chapterLabels } from "@/lib/site";

export type ReportData = {
  profile: Profile;
  name: string;
  line: string;
  summary: string;
  sample: boolean;
  demo: boolean;
  strengths: Insight[];
  blindspots: Insight[];
  relationships: Insight[];
  work: Insight[];
};

const CHAPTER_PARAM = "chapter";

function parseChapter(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n - 1 : 0;
}

/** Sidebar + article. Chapter state lives in the client and mirrors to `?chapter=` for sharing/back. */
export function ReportView({ data }: { data: ReportData }) {
  const searchParams = useSearchParams();
  // Seeded from the URL so `?chapter=2` renders the right chapter on the server; clicks then
  // update local state and mirror it into the URL without a router round trip.
  const [chapter, setChapterState] = useState(() => parseChapter(searchParams.get(CHAPTER_PARAM)));
  const [strength, setStrength] = useState(true);
  const { profile, name, line, summary, sample, demo } = data;
  const letters = profile.type.split("");

  useEffect(() => {
    const onPop = () => setChapterState(parseChapter(new URLSearchParams(window.location.search).get(CHAPTER_PARAM)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setChapter = (i: number) => {
    setChapterState(i);
    const url = new URL(window.location.href);
    if (i === 0) url.searchParams.delete(CHAPTER_PARAM);
    else url.searchParams.set(CHAPTER_PARAM, String(i + 1));
    window.history.replaceState(window.history.state, "", url);
    window.scrollTo({ top: 0 });
  };

  const insightList = (items: Insight[], keyPrefix: string) =>
    items.map((it, i) => (
      <section key={`${keyPrefix}-${i}`} className="flex gap-[13px] border-b border-night-line py-[25px] md:gap-5 md:py-7">
        <span className="pt-[5px] text-[9px] text-[#a38f7a]">0{i + 1}</span>
        <div>
          <h3 className="text-[15px] leading-[1.7] font-medium md:text-[14px]">{it.title}</h3>
          <p className="mt-[10px] text-[13px] leading-[2.1] text-[#a6b6bc] md:text-[12px]">{it.body}</p>
        </div>
      </section>
    ));

  return (
    <main className="block md:mx-auto md:grid md:max-w-[1100px] md:grid-cols-[190px_minmax(0,720px)] md:items-start md:gap-[30px] md:px-[30px] md:pt-10 md:pb-[70px] xl:grid-cols-[220px_minmax(0,720px)] xl:gap-[68px]">
      <aside className="hidden md:sticky md:top-[35px] md:block md:pt-[15px]">
        <p className="eyebrow text-[9px] text-[#758289]">YOUR INNER WORLD</p>
        <div className="mt-[26px] text-[64px] font-medium tracking-[-0.06em]">{profile.type}</div>
        <p className="mt-1 text-[12px] text-[#75828a]">
          {name} · {sample ? "示例" : "本次"}人格报告
        </p>
        <Badge variant="unlocked" className="mt-[18px]">
          <Check size={12} />
          已解锁{demo ? " · 演示" : ""}
        </Badge>
        <nav className="mt-[46px] flex flex-col gap-1" aria-label="报告章节">
          {chapterLabels.map((l, i) => (
            <button
              key={l}
              type="button"
              onClick={() => setChapter(i)}
              className={cn("flex min-h-[54px] items-center gap-4 border-b border-line text-left text-[12px]", chapter === i && "font-semibold")}
            >
              <span className="text-[10px] text-[#929ea4]">0{i + 1}</span>
              {l}
              <ArrowUpRight size={15} className={cn("ml-auto opacity-0", chapter === i && "opacity-100")} />
            </button>
          ))}
        </nav>
        <p className="mt-20 text-[9px] tracking-[0.1em] text-[#8b999f] whitespace-pre-line">{"YOU ARE MORE\nTHAN FOUR LETTERS."}</p>
      </aside>

      <article key={chapter} className="animate-appear bg-night px-[25px] pt-[25px] pb-[55px] text-[#eff2f4] md:p-[35px] xl:px-[50px] xl:py-11">
        <div className="mb-[18px] flex justify-between text-[9px] text-[#a5b5bc] md:hidden">
          <span>
            {profile.type} · {name}
          </span>
          <span>完整报告{demo ? " · 演示" : ""}</span>
        </div>
        <Tabs value={String(chapter)} onValueChange={(v) => setChapter(Number(v))} className="md:hidden">
          <TabsList className="-mx-[10px] mb-[31px] grid grid-cols-4 border-b border-[#344046] pb-[10px]" aria-label="报告章节">
            {chapterLabels.map((l, i) => (
              <TabsTrigger
                key={l}
                value={String(i)}
                className="py-[9px] text-[10px] leading-[1.8] text-[#7f949c] whitespace-nowrap data-active:text-[#e1c4aa]"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mb-[23px] flex justify-between text-[9px] tracking-[0.12em] text-[#95a5a9] md:mb-[31px]">
          <span>CHAPTER 0{chapter + 1}</span>
          <span>{profile.type}</span>
        </div>

        {chapter === 0 && (
          <>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.03em] md:text-[31px]">{line}</h1>
            <p className="mt-5 text-[13px] leading-[2.25] text-[#a9b5b9] md:mt-[22px] md:leading-[2.15]">{summary}</p>
            <div className="my-7 bg-[#eaf0f2] p-5 text-[#182126] md:mt-[35px] md:mb-[27px] md:p-[22px]">
              <Radar profile={profile} height={260} className="mb-[25px]" />
              <div>
                {letters.map((l, i) => (
                  <div key={l} className="not-first:mt-[22px]">
                    <div className="flex items-center justify-between text-[12px]">
                      <b className="font-medium">
                        {poles[l].label} <small className="ml-1 text-[#8a969b]">{l}</small>
                      </b>
                      <span>{profile.values[i]}%</span>
                    </div>
                    <Progress value={profile.values[i]} max={100} className="mt-[9px]" indicatorClassName="bg-[#b89273]" aria-label={`${poles[l].label} ${profile.values[i]}%`} />
                    <p className="mt-[6px] text-[9px] text-[#73858c]">
                      {poles[l].need}
                      {profile.balanced[i] ? " · 偏好接近均衡" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <Quote>{"你不需要符合一个类型，\n你只需要更了解自己。"}</Quote>
            <Body>这些倾向来自你本次的回答。环境、角色和最近的经历，都可能影响你的表达方式。把它当作观察自己的起点，看看哪些描述与你的生活相呼应。</Body>
          </>
        )}

        {chapter === 1 && (
          <>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.03em] md:text-[31px]">{"理解你的优势，\n也温柔地看见盲点。"}</h1>
            <div className="my-7 flex rounded-[50px] bg-[#263034] p-1" role="tablist" aria-label="优势与盲点">
              {[
                ["你的优势", true],
                ["容易忽略的", false],
              ].map(([label, value]) => (
                <button
                  key={String(label)}
                  type="button"
                  role="tab"
                  aria-selected={strength === value}
                  onClick={() => setStrength(value as boolean)}
                  className={cn("min-h-[37px] flex-1 rounded-[50px] text-[11px] text-[#9aaab0] md:text-[12px]", strength === value && "bg-[#eef2f3] text-[#222a2d]")}
                >
                  {label}
                </button>
              ))}
            </div>
            {insightList(strength ? data.strengths : data.blindspots, strength ? "s" : "b")}
            <Quote>{"优势不需要时时在线。\n适合自己的节奏，同样重要。"}</Quote>
          </>
        )}

        {chapter === 2 && (
          <>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.03em] md:text-[31px]">{"好的关系，\n从被理解开始。"}</h1>
            <Lead>把“你应该懂我”，换成一次更具体的表达。你的偏好值得被看见，对方的也一样。</Lead>
            {insightList(data.relationships, "r")}
            <Quote>{"“这件事让我感到……\n我希望我们可以……”"}</Quote>
            <Body>试着在一次小分歧中使用这句话。描述具体情境和自己的需要，避免用人格标签解释对方的一切。</Body>
          </>
        )}

        {chapter === 3 && (
          <>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.03em] md:text-[31px]">{"找到适合你的方式，\n让成长具体一点。"}</h1>
            <Lead>与其用人格类型决定职业，不如观察：什么环境能让你稳定发挥，什么习惯值得调整。</Lead>
            {insightList(data.work, "w")}
            <div className="my-[33px] bg-[#243034] p-[25px]">
              <p className="eyebrow text-[9px] text-[#b1bfc4]">A SMALL STEP THIS WEEK</p>
              <h3 className="mt-5 text-[20px] leading-[1.7] font-normal whitespace-pre-line md:text-[21px]">{"记录一次让你感到\n“这很像我”的时刻。"}</h3>
              <p className="mt-[15px] text-[11px] text-[#a9b7bc] whitespace-pre-line">{"当时你在做什么？和谁在一起？\n哪一个需要被满足了？"}</p>
            </div>
            <Body>一周后再回看这段记录。真实的生活体验，比任何四个字母都更能帮助你理解自己。</Body>
          </>
        )}

        <div className="mt-[38px] border-t border-night-line pt-[21px] text-right">
          {chapter < 3 ? (
            <button type="button" onClick={() => setChapter(chapter + 1)} className="text-link text-[11px] text-[#e0e7ea]">
              下一章 · {chapterLabels[chapter + 1]}
              <ArrowRight size={17} />
            </button>
          ) : (
            <Link href="/" className="text-link text-[11px] text-[#e0e7ea]">
              带着新的理解，回到生活
              <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      </article>
    </main>
  );
}

function Quote({ children }: { children: string }) {
  return (
    <blockquote className="my-[30px] border-l border-[#bc9c7f] py-[26px] pl-[15px] text-[20px] leading-[1.7] font-normal tracking-[-0.02em] whitespace-pre-line text-[#d4b99f] md:my-10 md:pl-5 md:text-[23px]">
      {children}
    </blockquote>
  );
}

function Lead({ children }: { children: string }) {
  return <p className="mt-5 text-[13px] leading-[2.25] text-[#a9b5b9] md:mt-[22px] md:leading-[2.15]">{children}</p>;
}

function Body({ children }: { children: string }) {
  return <p className="mt-[22px] text-[13px] leading-[2.15] text-[#a9b5b9] md:text-[12px]">{children}</p>;
}
