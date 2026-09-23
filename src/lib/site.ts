import { enChapterLabels, enChoices, enFaqs, enSite, enUnlockBullets } from "@/lib/i18n/content/en/site";
import type { Locale } from "@/lib/i18n/locale";

/** Client-safe site constants and copy. Server-only configuration lives in `@/lib/env`. */
export const site = {
  name: "观己 mirror",
  brand: "mirror",
  brandZh: "观己",
  tagline: "向内看见，真实的自己",
  title: "MBTI 测试体验｜16 型人格探索 · 观己 mirror",
  description: "观己 Mirror 原创 MBTI 测试体验，32 题轻量版与 64 题标准版可选。免费了解四维人格偏好；非官方 MBTI 量表。",
  supportEmail: "lakehu0x@gmail.com",
  themeColor: "#edf2f3",
  locale: "zh_CN",
} as const;

export const choices = [
  { v: 2, l: "非常符合" },
  { v: 1, l: "比较符合" },
  { v: 0, l: "说不准" },
  { v: -1, l: "不太符合" },
  { v: -2, l: "很不符合" },
] as const;

export const chapterLabels = ["性格总览", "优势与盲点", "关系与沟通", "工作与成长"] as const;

export const blindspotTitles = ["精力的边界", "视角的边界", "决策的边界", "节奏的边界"] as const;

export const unlockBullets = ["双人相处指南：理解彼此、练习沟通", "按偏好强弱与近均衡情况解读场景", "优势盲点、沟通示例与工作安排", "七天小实践与复盘问题"] as const;

/** `690` -> `6.9`, `700` -> `7`, `1280` -> `12.8` */
export function formatPriceFen(fen: number): string {
  const yuan = fen / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2).replace(/0+$/, "");
}

export function faqs(): [string, string][] {
  return [
    ["测试需要多久？", "32 题轻量版约 5 分钟；64 题标准版覆盖更多情境，约 8–10 分钟。时长为初步估计，题数更多不代表更准确。"],
    ["应该按什么状态回答？", "回想最近一段时间的日常，而非理想中的自己。没有好坏答案；如果情境不熟悉，可以选“说不准”，也可以返回检查。"],
    ["可以暂停或重新开始吗？", "各版本进度分别保存在当前浏览器，可暂停续答、查看已答题或重新开始。浏览器不能保存时会提示，当前页面仍可作答，但关闭或刷新可能丢失草稿。"],
    ["结果能定义我吗？", "不能。人格偏好会随情境和经历有所变化，结果用于自我探索，不用于诊断、招聘筛选或给他人贴标签。"],
    ["这是官方 MBTI 测评吗？", "这是参考四维人格偏好设计的独立体验，采用原创演示题目，并非官方 MBTI 量表。"],
    ["四个维度都接近中间，怎么理解？", "每次作答都会给出四个字母。某个维度接近 50% 时，字母只作对照，应同时阅读两端；四个维度都接近中间，说明这次的倾向普遍较轻，可以先看各维度的分数与解读，也可以过一段时间再测。"],
    ["百分比和复测变化说明什么？", "百分比只是本问卷的作答位置，不是能力分、准确率或人群百分位。状态与情境会影响回答，先看维度变化，不同版本分数不直接视为等价。"],
    ["如何找回之前的报告？", "“我的报告”列出同一用户的全部测试。换设备或清除浏览器数据后，可凭任意一个完整网站订单号找回；微信账单中使用商户单号。找回只恢复该访客的测试记录，不会改变任何一份报告已经能读到的内容。"],
  ];
}

/** Per-locale views of the shared copy above. Chinese returns the originals unchanged. */
export function siteCopy(locale: Locale) {
  return locale === "en" ? { ...site, ...enSite } : { ...site, trademark: null };
}

export function choicesFor(locale: Locale) {
  return locale === "en" ? choices.map((choice, i) => ({ v: choice.v, l: enChoices[i] })) : choices;
}

export function chapterLabelsFor(locale: Locale): readonly string[] {
  return locale === "en" ? enChapterLabels : chapterLabels;
}

export function unlockBulletsFor(locale: Locale): readonly string[] {
  return locale === "en" ? enUnlockBullets : unlockBullets;
}

export function faqsFor(locale: Locale): [string, string][] {
  return locale === "en" ? enFaqs() : faqs();
}

/** localStorage keys shared by client islands. */
export const storageKeys = {
  quiz: "mirror.quiz.v1",
  quizVersions: "mirror.quiz.v2",
  lastResult: "mirror.lastResult.v1",
  /** Days of the report's seven-day practice a reader has ticked, per report. A convenience, never a record. */
  practice: "mirror.practice.v1",
} as const;

export type PaymentMode = "mock" | "wechat" | "crypto" | "waffo";
