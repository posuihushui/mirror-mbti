import type { Locale } from "@/lib/i18n/locale";

/** Shared site chrome. Chinese strings are the originals, verbatim; `en` must match their shape. */
const zh = {
  header: {
    homeLabel: "观己 mirror 首页",
    navLabel: "主导航",
    quiz: "人格测试",
    about: "了解测试",
    myReport: "我的报告",
    aboutShort: "测试说明",
    language: "语言",
  },
  overlays: {
    aboutTitle: "关于这次探索",
    aboutDescription: "按照自己的节奏，回答每一道题。",
    emptyTitle: "属于你的故事，还未开始。",
    emptyDescription: "完成测试后，在这里找回本次的性格报告。",
  },
  about: {
    intro: "认识自己，不是把自己放进一个盒子。\n是多一种理解自己的语言。",
    help: "订单帮助与联系",
    start: "开始认识自己",
  },
  empty: {
    text: "你还没有完成测试。\n选择适合你的题目版本，认识真实的自己。",
    start: "开始测试",
    sample: "先看看报告示例",
  },
  receipt: {
    copied: "订单号已复制，请妥善保存",
    copyFailed: "暂时无法复制，请长按订单号保存",
    label: "本网站订单号",
    copy: "复制订单号",
    note: "订单号可找回该用户的全部测试记录，包括已解锁的报告。请妥善保存，不要向他人公开。",
  },
  recover: {
    failed: "暂时无法找回，请稍后重试。",
    formLabel: "通过订单找回测试记录",
    label: "订单号",
    placeholder: "输入以 M 开头的完整订单号",
    help: "可在原浏览器的“我的报告 → 订单与找回凭据”中查看；微信账单中请使用商户单号，而非微信交易单号。",
    pending: "正在找回…",
    submit: "找回测试记录",
    footnote: "订单号是找回凭据，请仅输入自己的订单号。找回后，此浏览器将记住对应用户。",
  },
  legal: {
    updated: (date: string) => `更新日期：${date}`,
  },
  notFound: {
    title: "页面不存在",
    heading: "这一页还没有故事。\n回到开始的地方。",
    body: "链接可能已过期，或者结果属于另一位访客。你可以回到首页重新开始。",
    home: "回到首页",
  },
  startButton: {
    resume: (answered: number, total: number) => `继续测试 · ${answered}/${total} 题`,
    start: "开始人格测试",
  },
  reviewAnswers: {
    readFailed: "暂时无法读取答案。",
    note: "检查答案会替换本版本未完成的草稿；再次提交会生成新记录，原结果与已购报告保留。",
    pending: "正在读取答案…",
    action: "检查答案并重新作答",
  },
};

const en: typeof zh = {
  header: {
    homeLabel: "mirror home",
    navLabel: "Main navigation",
    quiz: "Personality test",
    about: "About the test",
    myReport: "My reports",
    aboutShort: "About",
    language: "Language",
  },
  overlays: {
    aboutTitle: "About this exploration",
    aboutDescription: "Answer each question at your own pace.",
    emptyTitle: "Your story hasn’t started yet.",
    emptyDescription: "After the test, you can find your personality report here.",
  },
  about: {
    intro: "Knowing yourself isn’t putting yourself in a box.\nIt’s gaining one more language for who you are.",
    help: "Order help & contact",
    start: "Start exploring",
  },
  empty: {
    text: "You haven’t finished a test yet.\nChoose a version that suits you and meet your true self.",
    start: "Start the test",
    sample: "See a sample report first",
  },
  receipt: {
    copied: "Order number copied — keep it somewhere safe",
    copyFailed: "Couldn’t copy — press and hold the order number to save it",
    label: "Order number",
    copy: "Copy order number",
    note: "Your order number can recover every test for this visitor, including unlocked reports. Keep it safe and don’t share it.",
  },
  recover: {
    failed: "Couldn’t recover right now — please try again later.",
    formLabel: "Recover tests with an order number",
    label: "Order number",
    placeholder: "Full order number starting with M",
    help: "You can find it in the original browser under “My reports → Orders & recovery”.",
    pending: "Recovering…",
    submit: "Recover my tests",
    footnote: "Order numbers are recovery credentials — only enter your own. After recovery, this browser will remember that visitor.",
  },
  legal: {
    updated: (date: string) => `Last updated: ${date}`,
  },
  notFound: {
    title: "Page not found",
    heading: "This page has no story yet.\nLet’s go back to the start.",
    body: "The link may have expired, or the result belongs to another visitor. You can go back home and start again.",
    home: "Back to home",
  },
  startButton: {
    resume: (answered: number, total: number) => `Continue · ${answered}/${total} answered`,
    start: "Start the personality test",
  },
  reviewAnswers: {
    readFailed: "Couldn’t load your answers right now.",
    note: "Reviewing replaces this version’s unfinished draft. Submitting again creates a new record; the original result and any purchased report are kept.",
    pending: "Loading answers…",
    action: "Review answers and retake",
  },
};

export const siteMessages: Record<Locale, typeof zh> = { zh, en };
