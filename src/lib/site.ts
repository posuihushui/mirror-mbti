/** Client-safe site constants and copy. Server-only configuration lives in `@/lib/env`. */
export const site = {
  name: "观己 mirror",
  brand: "mirror",
  brandZh: "观己",
  tagline: "向内看见，真实的自己",
  title: "观己 mirror — 向内看见，真实的自己",
  description: "观己 Mirror，以 32 道日常情境题认识自己。免费测试与性格概览，完整人格报告一次解锁。",
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

export const unlockBullets = ["性格画像与四维偏好", "优势、盲点与关系沟通", "工作方式与可实践的成长建议"] as const;

/** `690` -> `6.9`, `700` -> `7`, `1280` -> `12.8` */
export function formatPriceFen(fen: number): string {
  const yuan = fen / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2).replace(/0+$/, "");
}

export function faqs(priceLabel: string): [string, string][] {
  return [
    ["测试需要多久？", "共 32 道日常情境题，通常约 5 分钟。选择最符合你最近状态的答案，每道题都可以返回修改。"],
    ["哪些内容需要付费？", `测试、人格类型与简短概览免费。完整报告为 ¥${priceLabel} 一次性解锁，包含优势盲点、关系沟通和成长建议，无订阅、无自动续费。`],
    ["结果能定义我吗？", "不能。人格偏好会随情境和经历有所变化，结果用于自我探索，不用于诊断、招聘筛选或给他人贴标签。"],
    ["这是官方 MBTI 测评吗？", "这是参考四维人格偏好设计的独立体验，采用原创演示题目，并非官方 MBTI 量表。"],
  ];
}

/** localStorage keys shared by client islands. */
export const storageKeys = {
  quiz: "mirror.quiz.v1",
  lastResult: "mirror.lastResult.v1",
} as const;

export type PaymentMode = "mock" | "wechat";
