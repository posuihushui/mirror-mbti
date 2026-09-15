import type { Locale } from "@/lib/i18n/locale";

/** Report copy. Chinese strings are the originals, verbatim; `en` must match their shape. */
const zh = {
  aside: {
    reportOf: (name: string, sample: boolean) => `${name} · ${sample ? "示例" : "本次"}人格报告`,
    sampleBadge: "示例报告",
    unlocked: (demo: boolean) => `已解锁${demo ? " · 演示" : ""}`,
    mobileLabel: (sample: boolean, demo: boolean) => (sample ? "示例报告" : `完整报告${demo ? " · 演示" : ""}`),
  },
  one: {
    quote: "你不需要符合一个类型，\n你只需要更了解自己。",
    body: "这些倾向来自你本次的回答。环境、角色和最近的经历，都可能影响你的表达方式。把它当作观察自己的起点，看看哪些描述与你的生活相呼应。",
  },
  two: {
    heading: "理解你的优势，\n也温柔地看见盲点。",
    quote: "优势不需要时时在线。\n适合自己的节奏，同样重要。",
  },
  three: {
    heading: "好的关系，\n从被理解开始。",
    lead: "把“你应该懂我”，换成一次更具体的表达。你的偏好值得被看见，对方的也一样。",
    quote: "“这件事让我感到……\n我希望我们可以……”",
    body: "试着在一次小分歧中使用这句话。描述具体情境和自己的需要，避免用人格标签解释对方的一切。",
  },
  four: {
    heading: "找到适合你的方式，\n让成长具体一点。",
    lead: "与其用人格类型决定职业，不如观察：什么环境能让你稳定发挥，什么习惯值得调整。",
    weekHeading: "把理解放进一周生活里。",
    weekIntro: "每天只做一个小尝试。以下安排根据本次四维作答选择，不是效果保证；不符合你的部分可以跳过或调整。",
    stepHeading: "记录一次让你感到\n“这很像我”的时刻。",
    stepQuestions: "当时你在做什么？和谁在一起？\n哪一个需要被满足了？",
    closing: "一周后再回看这段记录。真实的生活体验，比任何四个字母都更能帮助你理解自己。",
  },
  nav: {
    label: "报告章节",
    closingSample: "开始属于你的测试",
    closing: "带着新的理解，回到生活",
    next: (label: string) => `下一章 · ${label}`,
    switchLabel: "优势与盲点",
    strengths: "你的优势",
    blindspots: "容易忽略的",
  },
};

const en: typeof zh = {
  aside: {
    reportOf: (name: string, sample: boolean) => `${sample ? "Sample report" : "Your report"} · ${name}`,
    sampleBadge: "Sample report",
    unlocked: (demo: boolean) => `Unlocked${demo ? " · Demo" : ""}`,
    mobileLabel: (sample: boolean, demo: boolean) => (sample ? "Sample report" : `Full report${demo ? " · Demo" : ""}`),
  },
  one: {
    quote: "You don’t need to fit a type.\nYou only need to know yourself better.",
    body: "These leanings come from your answers this time. Your environment, roles and recent experiences can all shape how you show up. Treat this as a starting point for observing yourself, and notice which descriptions echo your life.",
  },
  two: {
    heading: "Understand your strengths,\nand gently see your blind spots.",
    quote: "Strengths don’t have to be on all the time.\nA pace that suits you matters just as much.",
  },
  three: {
    heading: "Good relationships\nbegin with being understood.",
    lead: "Swap “you should understand me” for one more specific way of saying it. Your preferences deserve to be seen — and so do theirs.",
    quote: "“This made me feel…\nI’d like us to…”",
    body: "Try this sentence in a small disagreement. Describe the situation and your own need, rather than explaining everything about the other person with a personality label.",
  },
  four: {
    heading: "Find the way that suits you,\nand make growth concrete.",
    lead: "Rather than letting a type decide your career, observe which environments help you do steady work and which habits are worth adjusting.",
    weekHeading: "Bring this understanding into one week.",
    weekIntro: "Try just one small thing each day. These were chosen from your answers on the four dimensions and are not a guarantee of results; skip or adjust anything that doesn’t fit.",
    stepHeading: "Note one moment that made you think,\n“That’s so me.”",
    stepQuestions: "What were you doing? Who were you with?\nWhich need was being met?",
    closing: "Look back at this note in a week. Real life experience helps you understand yourself more than any four letters can.",
  },
  nav: {
    label: "Report chapters",
    closingSample: "Start your own test",
    closing: "Take this understanding back into life",
    next: (label: string) => `Next chapter · ${label}`,
    switchLabel: "Strengths and blind spots",
    strengths: "Your strengths",
    blindspots: "Easy to miss",
  },
};

export const reportMessages: Record<Locale, typeof zh> = { zh, en };
