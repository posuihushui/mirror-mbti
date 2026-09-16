import { shareMessages } from "@/lib/i18n/messages/share";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { TrackView } from "@/components/analytics/track-view";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { RecoverReports } from "@/components/report/recover-reports";
import { trackAttrs } from "@/lib/analytics/events";
import { href, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { hasClearPreference, polesFor, profileMeta, type Letter } from "@/lib/personality";
import { dimensions, questionnaireLocale, questionnaireName } from "@/lib/questionnaires";
import { resultsForVisitor, type ResultHistoryItem } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: pageMessages[locale].history.title, robots: { index: false, follow: false } };
}

/** The loading boundary keeps history request-scoped; each report still checks access on its server route. */
export default async function MyReportPage() {
  const locale = await getLocale();
  const t = pageMessages[locale].history;
  const visitorId = await getVisitorId();
  const results = visitorId ? await resultsForVisitor(visitorId) : [];
  const hasHistory = results.length > 0;

  return (
    <>
      <AppHeader variant="page" title={t.title} backHref={href(locale, "/")} path="/my/report" />
      <main className="mx-auto max-w-[1000px] px-[27px] pt-7 pb-[80px] md:px-10 md:pt-[55px]">
        <p className="eyebrow text-mist">{t.eyebrow}</p>
        <Link href={href(locale,"/my/shares")} prefetch={false} className="text-link mt-4">{shareMessages[locale].myShares}</Link>
        <div className="mt-[18px] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[38px]">
              {hasHistory ? t.headingHas : t.headingEmpty}
            </h1>
            <p className="mt-3 text-[12px] leading-[2] text-mist md:text-[13px]">
              {hasHistory ? t.summary(results.length) : t.empty}
            </p>
          </div>
          <PrimaryButton href={href(locale, "/quiz")} className="md:w-[200px] md:shrink-0" {...trackAttrs("start_quiz", "page_cta")}>{hasHistory ? t.continue : t.start}</PrimaryButton>
        </div>
        {hasHistory ? (
          <>
            <section className="mt-[35px] flex flex-col gap-6 md:mt-[45px]" aria-label={t.listLabel}>
              {results.map((result) => <HistoryItem key={result.id} result={result} locale={locale} />)}
            </section>
            <p className="mt-7 text-[11px] leading-[1.9] text-mist">
              {t.keepOrders}
            </p>
            <Accordion type="single" collapsible className="mt-6 max-w-[560px]">
              <AccordionItem value="recover">
                <AccordionTrigger {...trackAttrs("recover_other", "page_cta")}>{t.recoverOther}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-6 text-[12px] leading-[2] text-mist">{t.recoverSwitch}</p>
                  <RecoverReports />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <section className="mt-[38px] max-w-[560px] border-t border-line pt-[30px]" aria-labelledby="recovery-title">
            <h2 id="recovery-title" className="text-[20px] leading-[1.6]">{t.recoveryHeading}</h2>
            <p className="mt-3 mb-6 text-[12px] leading-[2] text-mist">
              {t.recoveryText}
            </p>
            <RecoverReports />
            <Link href={href(locale, "/result/sample")} className="text-link mt-6" {...trackAttrs("view_sample_result", "page_cta")}>{t.sample} <ArrowUpRight size={16} /></Link>
          </section>
        )}
      </main>
      <TrackView event="my_report_view" params={{ record_count: results.length, unlocked_count: results.filter((result) => result.unlocked).length }} />
    </>
  );
}

/** A record is described in the page's language but links to the language it was taken in. */
function HistoryItem({ result, locale }: { result: ResultHistoryItem; locale: Locale }) {
  const t = pageMessages[locale].history;
  const { profile, order, unlocked, createdAt } = result;
  const { name, summary, typeLabel } = profileMeta(profile, locale);
  const poles = polesFor(locale);
  const own = questionnaireLocale(result.questionnaireId);
  const clear = hasClearPreference(profile);
  const demo = order?.provider === "mock";
  const dateFormat = new Intl.DateTimeFormat(t.dateLocale, {
    timeZone: t.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return (
    <article aria-label={t.recordLabel(typeLabel)} className="border border-line px-[22px] py-6 md:px-[30px] md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {createdAt && <time dateTime={createdAt.toISOString()} className="text-[11px] text-mist">{dateFormat.format(createdAt)}</time>}
        <Badge variant={unlocked ? "unlocked" : "tag"}>{unlocked ? t.unlocked(demo) : t.brief}</Badge>
      </div>
      <p className="mt-3 text-[12px] text-mist">{t.version(questionnaireName(result.questionnaireId, locale) ?? pageMessages[locale].result.legacyVersion, result.questionCount)}</p>
      <div className="mt-5 flex items-baseline gap-3">
        <h2 className="text-[38px] font-medium tracking-[-0.06em] md:text-[44px]">{typeLabel}</h2>
        <span className="text-[12px]">{name}</span>
      </div>
      <p className="mt-3 max-w-[680px] text-[12px] leading-[2] text-mist md:text-[13px]">{summary}</p>
      <dl className="mt-6 grid grid-cols-4 border-y border-line py-4">
        {profile.type.split("").map((letter, i) => (
          <div key={letter} className="flex flex-col gap-2 text-center not-first:border-l not-first:border-line">
            <dt className="text-[11px] text-mist">{profile.balanced[i] ? dimensions[i].split("").join(" / ") : `${poles[letter as Letter].label} ${letter}`}</dt>
            <dd className="text-[20px]">{profile.values[i]}<span className="text-[11px]">%</span></dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PrimaryButton href={href(own, unlocked ? `/report/${result.id}` : `/result/${result.id}`)} prefetch={false} className="md:w-[220px]" {...trackAttrs(unlocked ? "read_report" : "view_result", "history_item")}>
          {unlocked ? t.readDetailed : t.viewBrief}
        </PrimaryButton>
        <Link href={href(own, unlocked || !clear ? `/result/${result.id}` : `/result/${result.id}?unlock=1`)} prefetch={false} className="text-link justify-center text-[12px]" {...trackAttrs(unlocked ? "view_result" : clear ? "unlock_report" : "review_answers", "history_item")}>
          {unlocked ? t.viewBrief : clear ? t.unlock : t.review} <ArrowUpRight size={16} />
        </Link>
      </div>
      {order && (
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="order">
            <AccordionTrigger {...trackAttrs("order_receipt", "history_item")}>{t.orderAccordion(demo)}</AccordionTrigger>
            <AccordionContent><OrderReceipt orderId={order.id} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </article>
  );
}
