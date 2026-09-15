import type { CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";

/** Both public and private pages receive only the categories explicitly agreed to. */
export function PreferenceSummary({ snapshot, locale, title }: { snapshot: CompareSnapshot; locale: Locale; title: string }) {
  const m = compareMessages[locale];
  return <section className="min-w-0 rounded-[4px] border border-line bg-paper p-6">
    <h2 className="text-xl font-medium">{title}</h2>
    <ul className="mt-5 space-y-3 text-sm leading-[1.8]">{(["EI", "SN", "TF", "JP"] as const).map((dimension) => <li key={dimension}><span className="mr-3 text-xs text-mist">{dimension}</span>{m.categoryLabels[snapshot.categories[dimension]]}</li>)}</ul>
    <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs leading-[1.8] text-mist"><div><dt>{m.questionnaire}</dt><dd>{snapshot.questionnaireId}</dd></div><div><dt>{m.testedAt}</dt><dd><time dateTime={snapshot.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(snapshot.createdAt))}</time></dd></div></dl>
  </section>;
}
