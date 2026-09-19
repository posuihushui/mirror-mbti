import type { Locale } from "@/lib/i18n/locale";

/** Result page copy. Chinese strings are the originals, verbatim; `en` must match their shape. */
const zh = {
  currency: "¥",
  typeIntro: {
    sampleEyebrow: "示例报告",
    ownEyebrow: "你的人格倾向",
    badge: (label: string) => `${label}倾向`,
    partialBalanced: "部分维度接近均衡，参考类型不代表四个维度都有明确偏向。",
    unclearNote: "本次暂不生成确定类型，也不提供新的付费解锁。",
  },
  chart: {
    heading: "四个维度，认识你的偏好",
    note: "百分比表示本次作答位置，无优劣之分。接近 50% 时，应同时观察两端。",
  },
  radar: {
    balanced: (dimension: string, value: number) => `${dimension} 接近均衡 ${value}%`,
    pole: (label: string, value: number) => `${label}偏好 ${value}%`,
    separator: "，",
  },
  reading: {
    heading: "比四个字母，更值得留意的事。",
    practice: "今天的小练习：",
    note: "百分比只是本问卷的作答位置，不是能力分、准确率或人群百分位。复测时先比较具体情境与维度变化；不同版本的分数不直接视为等价。",
    link: "了解四维偏好与复测",
  },
  unlock: {
    eyebrow: "你不止于此",
    heading: "四个字母，\n只是故事的开始。",
    sub: "理解自己的优势，也看见那些容易忽略的部分。",
    sampleLink: "先阅读完整示例",
    items: ["按本次偏好强弱解读优势与盲点", "具体沟通示例与工作安排", "一周行动计划与复盘问题"],
    priceNote: "一次解锁完整报告\n无订阅 · 无自动续费",
    after: "购买后可在“我的报告”回访；保存订单号，也能在换设备后找回。报告为基于作答的情境建议，不是诊断或准确性保证。",
    help: "订单与找回帮助",
  },
  sampleCta: {
    meta: [["32/64", "题可选"], ["5–10", "分钟"], ["16", "种人格倾向"]] as [string, string][],
    eyebrow: "轮到你了",
    heading: "属于你的故事，\n还未开始。",
    body: "这是一份示例报告。选择 32 题或 64 题版本，免费了解自己的四维偏好。",
    start: "开始认识自己",
    footnote: "免费测试与性格概览",
  },
  sampleNotice: {
    eyebrow: "示例报告",
    body: "这是一份示例，用一次 INFJ 的作答生成，展示完整报告的样子。完成测试后，你会读到属于自己的那一份。",
    start: "开始认识自己",
  },
  actions: {
    readFull: "阅读完整报告",
    read: "阅读报告",
    unlock: "解锁完整报告",
    startMine: "开始我的测试",
    dockLabel: "完整人格报告",
    perTime: " / 次",
  },
};

const en: typeof zh = {
  currency: "$",
  typeIntro: {
    sampleEyebrow: "SAMPLE REPORT",
    ownEyebrow: "YOUR PERSONALITY",
    badge: (label: string) => label,
    partialBalanced: "Some dimensions are close to balanced, so the reference type doesn’t mean all four have a clear lean.",
    unclearNote: "No definite type is given this time, and no new paid unlock is offered.",
  },
  chart: {
    heading: "Four dimensions of your preferences",
    note: "Percentages show where your answers fell this time — neither side is better. Near 50%, watch both ends.",
  },
  radar: {
    balanced: (dimension: string, value: number) => `${dimension} close to balanced ${value}%`,
    pole: (label: string, value: number) => `${label} ${value}%`,
    separator: ", ",
  },
  reading: {
    heading: "What matters more than four letters.",
    practice: "Today’s small practice: ",
    note: "Percentages only show where your answers fell on this questionnaire — not ability, accuracy or a population percentile. When you retake, compare situations and dimension changes first; scores from different versions aren’t directly equivalent.",
    link: "The four preferences & retesting",
  },
  unlock: {
    eyebrow: "THERE IS MORE TO YOU",
    heading: "Four letters are\nonly the beginning.",
    sub: "Understand your strengths, and see the parts that are easy to miss.",
    sampleLink: "Read the full sample first",
    items: ["Strengths and blind spots read by the strength of each preference", "Concrete communication examples and work routines", "A one-week action plan with reflection questions"],
    priceNote: "One-time unlock of the full report\nNo subscription · No auto-renewal",
    after: "After purchase, revisit it in “My reports”; keep your order number to recover it on another device. The report offers situational suggestions based on your answers — not a diagnosis or a guarantee of accuracy.",
    help: "Order & recovery help",
  },
  sampleCta: {
    meta: [["32/64", "items"], ["5–10", "minutes"], ["16", "types"]],
    eyebrow: "YOUR TURN",
    heading: "Your story\nhasn’t started yet.",
    body: "This is a sample report. Choose the 32- or 64-item version to explore your four preferences for free.",
    start: "Start exploring",
    footnote: "Free test and overview",
  },
  sampleNotice: {
    eyebrow: "SAMPLE REPORT",
    body: "This is a sample, generated from one set of INFJ answers, to show what the full report looks like. After the test, you’ll read one of your own.",
    start: "Start exploring",
  },
  actions: {
    readFull: "Read the full report",
    read: "Read report",
    unlock: "Unlock the full report",
    startMine: "Start my test",
    dockLabel: "Full report",
    perTime: " once",
  },
};

export const resultMessages: Record<Locale, typeof zh> = { zh, en };
