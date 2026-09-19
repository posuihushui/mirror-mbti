import { enSite } from "@/lib/i18n/content/en/site";
import { href, type Locale } from "@/lib/i18n/locale";
import { TYPES, typeMeta } from "@/lib/personality";
import { preferenceDimensionsFor, preferenceNotesFor } from "@/lib/preference-content";
import { contentUpdatedAt } from "@/lib/seo";
import { chapterLabelsFor, faqsFor, site, unlockBulletsFor } from "@/lib/site";
import { typeContext } from "@/lib/type-context";

/**
 * `/llms.txt` and `/llms-full.txt` (llmstxt.org) for AI answer engines, one pair per locale
 * (`/en/llms.txt` for English). Built only from the same copy the pages render, so the files
 * cannot drift from the site.
 */
export type LlmsContext = { baseUrl: string };

const overview =
  "mirror (观己) is an MBTI-style self-exploration quiz in Chinese (at /) and English (at /en), built mobile-first. It uses original everyday-situation items, is not the official MBTI® instrument, has not been psychometrically validated, and is meant for self-reflection — not diagnosis, hiring or labelling people.";

const copy = {
  zh: {
    title: site.name,
    summary: `> ${site.description}`,
    facts: [
      "测试、人格类型与简短概览免费。",
      `完整报告四章：${chapterLabelsFor("zh").join("、")}；内容包括${unlockBulletsFor("zh").join("；")}。`,
      `人格模型：${preferenceDimensionsFor("zh").map((d) => d.pair).join("、")}四个维度组合成 16 种倾向。`,
      "边界：原创自我探索问卷，并非官方 MBTI 量表，也未经过心理测量学验证；结果用于自我探索，不用于诊断、招聘筛选或给他人贴标签。",
      `联系：${site.supportEmail}`,
    ],
    pages: [
      ["/quiz", "开始测试", "选择 32 题轻量版或 64 题标准版，免费查看人格类型与概览"],
      ["/result/sample", "示例性格画像", "示例数据的四维偏好雷达图与人格概览"],
      ["/report/sample", "完整示例报告", "与完整报告同一版式的四章示例全文，可免费阅读"],
      ["/preferences", "四维人格偏好与复测说明", "E/I、S/N、T/F、J/P 的含义，接近 50% 与复测变化怎么理解"],
      ["/about", "测试说明与常见问题", "版本区别、作答方式与结果边界"],
      ["/types", "16 种人格倾向", "十六种倾向一览，每种都有独立说明页"],
      ["/help", "测试、订单与数据帮助", "暂停续答、订单找回、数据删除与联系方式"],
    ],
    headings: { facts: "关键事实", pages: "主要页面", types: "16 种人格倾向", faq: "常见问题", preferences: "四维人格偏好" },
    typeLink: (type: string, name: string) => `${type} ${name}`,
    full: { label: "完整内容版", note: "常见问题、四维偏好说明与 16 种倾向的全文", title: "完整内容" },
    privacy: "隐私政策",
    terms: "用户协议",
    other: { label: "English version", locale: "en" as Locale },
    updated: (baseUrl: string) => `内容更新：${contentUpdatedAt} · 网站：${baseUrl}`,
    question: (question: string) => `观察问题：${question}`,
    typeSection: (type: string, locale: Locale, url: (path: string) => string) => {
      const { name, line, summary } = typeMeta(type, "zh");
      const context = typeContext(type, locale);
      return [
        `### ${type} ${name}`, "", `网址：${url(`/types/${type}`)}`, "", context.definition, "", `${line.replace("\n", "")}${summary}`, "",
        `- 日常表现：${context.everyday.join("")}`,
        `- 常见误解：${context.misconceptions.join("")}`,
        `- 沟通示例：“${context.communication}”`,
        `- 相邻类型：${context.neighbors.map((n) => `${n.type} ${typeMeta(n.type, "zh").name}（${n.dimension.split("").join("/")}）`).join("、")}`,
        "",
      ];
    },
  },
  en: {
    title: enSite.name,
    summary: `> ${enSite.description}`,
    facts: [
      "The test, your type and a short overview are free.",
      `The full report has four chapters: ${chapterLabelsFor("en").join(", ")}. It includes ${unlockBulletsFor("en").map((b) => b.charAt(0).toLowerCase() + b.slice(1)).join("; ")}.`,
      `Model: four dimensions (${preferenceDimensionsFor("en").map((d) => d.pair).join(", ")}) combine into 16 types. Types are shown as four letters with their preference labels, without nicknames.`,
      "Limits: an original self-exploration questionnaire, not the official MBTI® instrument and not psychometrically validated; results are for self-exploration, not diagnosis, hiring or labelling people.",
      `Contact: ${site.supportEmail}`,
    ],
    pages: [
      ["/quiz", "Take the test", "Choose the 32-item Quick or 64-item Standard version; your type and overview are free"],
      ["/result/sample", "Sample personality profile", "A four-preference radar chart and overview from sample data"],
      ["/report/sample", "Full sample report", "All four chapters in the same layout as the full report, free to read"],
      ["/preferences", "The four preferences & retesting", "What E/I, S/N, T/F and J/P mean, and how to read scores near 50% and retest changes"],
      ["/about", "About the test & FAQ", "Versions, how to answer and the limits of results"],
      ["/types", "16 personality types", "All sixteen types, each with its own page"],
      ["/help", "Help with tests, orders and data", "Resuming, order recovery, data deletion and contact"],
    ],
    headings: { facts: "Key facts", pages: "Main pages", types: "16 personality types", faq: "FAQ", preferences: "The four preferences" },
    typeLink: (type: string) => type,
    full: { label: "Full content", note: "The FAQ, the four preferences and all 16 types in full", title: "Full content" },
    privacy: "Privacy policy",
    terms: "Terms of service",
    other: { label: "中文版", locale: "zh" as Locale },
    updated: (baseUrl: string) => `Content updated: ${contentUpdatedAt} · Site: ${baseUrl}/en`,
    question: (question: string) => `Question to notice: ${question}`,
    typeSection: (type: string, locale: Locale, url: (path: string) => string) => {
      const { line, summary } = typeMeta(type, "en");
      const context = typeContext(type, locale);
      return [
        `### ${type}`, "", `URL: ${url(`/types/${type}`)}`, "", context.definition, "", `${line.replace("\n", " ")} ${summary}`, "",
        `- Everyday: ${context.everyday.join(" ")}`,
        `- Common misconceptions: ${context.misconceptions.join(" ")}`,
        `- Communication example: “${context.communication}”`,
        `- Neighbouring types: ${context.neighbors.map((n) => `${n.type} (${n.dimension.split("").join("/")})`).join(", ")}`,
        "",
      ];
    },
  },
};

function urlFor(ctx: LlmsContext, locale: Locale) {
  return (path: string) => `${ctx.baseUrl}${href(locale, path)}`;
}

export function llmsText(ctx: LlmsContext, locale: Locale = "zh"): string {
  const t = copy[locale];
  const url = urlFor(ctx, locale);
  const other = urlFor(ctx, t.other.locale);
  return [
    `# ${t.title}`,
    "",
    t.summary,
    "",
    overview,
    "",
    `## ${t.headings.facts}`,
    "",
    ...t.facts.map((fact) => `- ${fact}`),
    "",
    `## ${t.headings.pages}`,
    "",
    ...t.pages.map(([path, title, note]) => `- [${title}](${url(path)}): ${note}`),
    "",
    `## ${t.headings.types}`,
    "",
    ...TYPES.map((type) => { const meta = typeMeta(type, locale); return `- [${t.typeLink(type, meta.name)}](${url(`/types/${type}`)}): ${meta.summary}`; }),
    "",
    "## Optional",
    "",
    `- [${t.full.label}](${url("/llms-full.txt")}): ${t.full.note}`,
    `- [${t.other.label}](${other("/llms.txt")})`,
    `- [${t.privacy}](${url("/privacy")})`,
    `- [${t.terms}](${url("/terms")})`,
    "",
  ].join("\n");
}

export function llmsFullText(ctx: LlmsContext, locale: Locale = "zh"): string {
  const t = copy[locale];
  const url = urlFor(ctx, locale);
  return [
    `# ${t.title} · ${t.full.title}`,
    "",
    t.summary,
    "",
    overview,
    "",
    t.updated(ctx.baseUrl),
    "",
    `## ${t.headings.facts}`,
    "",
    ...t.facts.map((fact) => `- ${fact}`),
    "",
    `## ${t.headings.faq}`,
    "",
    ...faqsFor(locale).flatMap(([q, a]) => [`### ${q}`, "", a, ""]),
    `## ${t.headings.preferences}`,
    "",
    ...preferenceDimensionsFor(locale).flatMap((d) => [`### ${d.pair} · ${d.title}`, "", d.description, "", t.question(d.question), ""]),
    ...preferenceNotesFor(locale).flatMap((note) => [`### ${note.title}`, "", note.body, ""]),
    `## ${t.headings.types}`,
    "",
    ...TYPES.flatMap((type) => t.typeSection(type, locale, url)),
  ].join("\n");
}
