import type { CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getQuestionnaire, questionnaireName } from "@/lib/questionnaires";

/**
 * Both public and private pages receive only the categories explicitly agreed to.
 * This is the consent scope, not the reading: it stays compact so the reading leads the page.
 */
export function PreferenceSummary({ snapshot, locale, title }: { snapshot: CompareSnapshot; locale: Locale; title: string }) {
  const m = compareMessages[locale];
  const questionnaire = getQuestionnaire(snapshot.questionnaireId);
  const version = questionnaireName(snapshot.questionnaireId, locale) ?? snapshot.questionnaireId;
  return <section className="min-w-0 rounded-[4px] border border-line bg-card p-5">
    <h2 className="eyebrow text-mist">{title}</h2>
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{(["EI", "SN", "TF", "JP"] as const).map((dimension) => <li key={dimension} className="flex items-baseline gap-2 text-sm">
      <span aria-hidden="true" className="text-xs tracking-wider text-mist">{dimension}</span>{m.categoryLabels[snapshot.categories[dimension]]}
    </li>)}</ul>
    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-mist">
      <div className="flex gap-2"><dt>{m.questionnaire}</dt><dd>{questionnaire ? pageMessages[locale].history.version(version, questionnaire.count) : version}</dd></div>
      <div className="flex gap-2"><dt>{m.testedAt}</dt><dd><time dateTime={snapshot.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(snapshot.createdAt))}</time></dd></div>
    </dl>
  </section>;
}
