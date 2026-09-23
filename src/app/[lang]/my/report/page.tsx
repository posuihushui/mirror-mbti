import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
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
import { polesFor, profileMeta, type Letter } from "@/lib/personality";
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
      <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
        <section className="surface-texture surface-texture-dark bg-night p-6 text-paper md:p-8">
        <div className="surface-content">
        <p className="eyebrow text-warm">{t.eyebrow}</p>
        <Link href={href(locale,"/my/shares")} prefetch={false} className="text-link mt-4 text-paper">{shareMessages[locale].myShares}</Link>
        <Link href={href(locale, "/my/pairing")} prefetch={false} className="text-link mt-4 ml-5 text-paper">{pairingUiMessages[locale].center}</Link>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl leading-normal tracking-[-0.035em] md:text-4xl">
              {hasHistory ? t.headingHas : t.headingEmpty}
            </h1>
            <p className="mt-3 text-xs leading-7 text-[#aebbc0] md:text-[13px]">
              {hasHistory ? t.summary(results.length) : t.empty}
            </p>
          </div>
          <PrimaryButton href={href(locale, "/quiz")} light className="md:w-52 md:shrink-0" {...trackAttrs("start_quiz", "page_cta")}>{hasHistory ? t.continue : t.start}</PrimaryButton>
        </div>
        </div>
        </section>
        {hasHistory ? (
          <>
            <section className="mt-8 flex flex-col gap-6 md:mt-10" aria-label={t.listLabel}>
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
  const demo = order?.provider === "mock";
  const dateFormat = new Intl.DateTimeFormat(t.dateLocale, {
    timeZone: t.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return (
    <article aria-label={t.recordLabel(typeLabel)} className="overflow-hidden border border-line bg-card">
      <div className="bg-night px-6 py-5 text-paper md:px-8 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {createdAt && <time dateTime={createdAt.toISOString()} className="text-[11px] text-[#aebbc0]">{dateFormat.format(createdAt)}</time>}
          <Badge variant={unlocked ? "unlocked" : "tag"} className="border-night-line bg-white/5 text-paper">{unlocked ? t.unlocked(demo) : t.brief}</Badge>
        </div>
        <p className="mt-3 text-xs text-[#99a8ac]">{t.version(questionnaireName(result.questionnaireId, locale) ?? pageMessages[locale].result.legacyVersion, result.questionCount)}</p>
        <div className="mt-5 flex items-baseline gap-3">
          <h2 className="text-4xl font-medium tracking-[-0.06em] md:text-5xl">{typeLabel}</h2>
          <span className="text-xs text-[#cbd5d8]">{name}</span>
        </div>
      </div>
      <div className="px-6 py-5 md:px-8 md:py-6">
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
        <Link href={href(own, unlocked ? `/result/${result.id}` : `/result/${result.id}?unlock=1`)} prefetch={false} className="text-link justify-center text-[12px]" {...trackAttrs(unlocked ? "view_result" : "unlock_report", "history_item")}>
          {unlocked ? t.viewBrief : t.unlock} <ArrowUpRight size={16} />
        </Link>
      </div>
      {unlocked && <PairingTracker resultId={result.id} surface="my_pairing"><Link href={href(own, `/my/pairing?result=${result.id}`)} prefetch={false} className="pill mt-5 inline-flex min-h-11">{pairingUiMessages[locale].invite}</Link></PairingTracker>}
      {order && (
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="order">
            <AccordionTrigger {...trackAttrs("order_receipt", "history_item")}>{t.orderAccordion(demo)}</AccordionTrigger>
            <AccordionContent><OrderReceipt orderId={order.id} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      </div>
    </article>
  );
}
