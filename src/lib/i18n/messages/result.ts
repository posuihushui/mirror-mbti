import type { Locale } from "@/lib/i18n/locale";

/** Result page copy. Chinese strings are the originals, verbatim; `en` must match their shape. */
const zh = {
  currency: "¥",
  typeIntro: {
    sampleEyebrow: "示例结果",
    ownEyebrow: "你的人格倾向",
    badge: (label: string) => `${label}倾向`,
    /** One line, named per dimension, in place of a second paragraph of caveats. */
    balancedNote: (pairs: string[]) => `${pairs.join("、")}接近均衡，这一项的字母只作对照，阅读时可以同时看两端。`,
    allBalanced: "四个维度都接近均衡，参考类型仅作对照，请同时阅读两端的解读。",
  },
  chart: {
    heading: "四个维度，认识你的偏好",
    note: "百分比表示本次作答位置，无优劣之分。接近 50% 时，应同时观察两端。",
  },
  radar: {
    balanced: (label: string, value: number) => `${label}偏好 ${value}%（接近均衡）`,
    pole: (label: string, value: number) => `${label}偏好 ${value}%`,
    separator: "，",
  },
  reading: {
    heading: "比四个字母，更值得留意的事。",
    lede: "偏向明显，说明这是你较常使用的起点，不代表另一端较弱；偏向不大时，换一个情境也可能用另一种方式。",
    practice: "今天的小练习",
    note: "百分比只是本问卷的作答位置，不是能力分、准确率或人群百分位。复测时先比较具体情境与维度变化；不同版本的分数不直接视为等价。",
    link: "了解四维偏好与复测",
  },
  unlock: {
    eyebrow: "你不止于此",
    heading: "读懂自己，\n也把理解带进关系。",
    sub: "完整报告按你这次的四个维度写成。下面是四章的开头：",
    previewLabel: "完整报告目录",
    sampleLink: "先阅读完整示例",
    priceNote: "单次解锁 · 无订阅",
    after: "购买后可在“我的报告”回访；保存订单号，也能在换设备后找回。报告为基于作答的情境建议，不是诊断或准确性保证。",
    help: "订单与找回帮助",
  },
  unlockBar: {
    title: "继续读完整报告",
    sub: "四章完整报告、七天小练习和双人指南，一次解锁。",
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
    unlock: "解锁报告与双人指南",
    startMine: "开始我的测试",
    dockLabel: "完整报告＋双人指南",
    perTime: " / 次",
  },
};

const en: typeof zh = {
  currency: "$",
  typeIntro: {
    sampleEyebrow: "SAMPLE RESULT",
    ownEyebrow: "YOUR PERSONALITY",
    badge: (label: string) => label,
    balancedNote: (pairs: string[]) => `${pairs.join(" and ")} ${pairs.length > 1 ? "are" : "is"} close to balanced — ${pairs.length > 1 ? "those letters are" : "that letter is"} only a reference, so read both ends.`,
    allBalanced: "All four dimensions are close to balanced, so the reference type is only a point of comparison — read both ends of each one.",
  },
  chart: {
    heading: "Four dimensions of your preferences",
    note: "Percentages show where your answers fell this time — neither side is better. Near 50%, watch both ends.",
  },
  radar: {
    balanced: (label: string, value: number) => `${label} ${value}% (close to balanced)`,
    pole: (label: string, value: number) => `${label} ${value}%`,
    separator: ", ",
  },
  reading: {
    heading: "What matters more than four letters.",
    lede: "A clear lean is a common starting point for you, not a sign the other side is weaker; a small lean may shift with the situation.",
    practice: "Today’s small practice",
    note: "Percentages only show where your answers fell on this questionnaire — not ability, accuracy or a population percentile. When you retake, compare situations and dimension changes first; scores from different versions aren’t directly equivalent.",
    link: "The four preferences & retesting",
  },
  unlock: {
    eyebrow: "THERE IS MORE TO YOU",
    heading: "Understand yourself,\nand bring it into your relationships.",
    sub: "The full report is written from your four dimensions this time. Here is how each chapter opens:",
    previewLabel: "Full report contents",
    sampleLink: "Read the full sample first",
    priceNote: "One-time unlock · No subscription",
    after: "After purchase, revisit it in “My reports”; keep your order number to recover it on another device. The report offers situational suggestions based on your answers — not a diagnosis or a guarantee of accuracy.",
    help: "Order & recovery help",
  },
  unlockBar: {
    title: "Keep reading: the full report",
    sub: "The full report, seven days of small practices and the guide for two, unlocked once.",
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
    unlock: "Unlock report & guide for two",
    startMine: "Start my test",
    dockLabel: "Report + guide for two",
    perTime: " once",
  },
};

export const resultMessages: Record<Locale, typeof zh> = { zh, en };
