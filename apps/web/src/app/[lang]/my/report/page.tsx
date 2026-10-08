import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { Metadata } from "next";
import { cn } from "cn";
import { TrackView } from "@/components/analytics/track-view";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { RecoverReports } from "@/components/report/recover-reports";
import { ReportPages } from "@/components/report/report-pages";
import { ElsewhereLink } from "@/components/site/elsewhere-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href, otherLocale, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, profileMeta, type Letter } from "@/lib/personality";
import { questionnaireLocale, questionnaireName } from "@/lib/questionnaires";
import { resultsForVisitor, type ResultHistoryItem } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { TypeName } from "@/components/result/type-name";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: pageMessages[locale].history.title, robots: { index: false, follow: false } };
}

/** The loading boundary keeps history request-scoped; each report still checks access on its server route. */
export default async function MyReportPage({ searchParams }: { searchParams: Promise<{ recover?: string }> }) {
  const locale = await getLocale();
  const t = pageMessages[locale].history;
  const visitorId = await getVisitorId();
  const all = visitorId ? await resultsForVisitor(visitorId) : [];
  // One language per page: a record opens in the language it was taken in, so the other's are one link away.
  const results = all.filter((result) => questionnaireLocale(result.questionnaireId) === locale);
  const elsewhere = all.length - results.length;
  const elsewhereLink = elsewhere > 0 && (
    <ElsewhereLink to={otherLocale(locale)} path="/my/report" {...trackAttrs("my_report", "page_cta")}>{pageMessages[locale].elsewhere.results(elsewhere)}</ElsewhereLink>
  );
  const hasHistory = results.length > 0;
  // `/help` links here with `?recover=1`, so someone who came to recover lands with the form open.
  const recoverOpen = (await searchParams).recover === "1";

  return (
    <>
      <AppHeader variant="page" title={t.title} backHref={href(locale, "/")} path="/my/report" />
      <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
        {/* Phones keep the intro to a few lines, so the first record starts on the first screen. */}
        <section className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:border-b md:border-line md:pb-8", !hasHistory && "border-b border-line pb-8")}>
          <div>
            <p className={cn("eyebrow mb-4 text-warm-ink", hasHistory && "max-md:hidden")}>{t.eyebrow}</p>
            <h1 className="text-3xl leading-heading md:text-4xl">
              {hasHistory ? t.headingHas : t.headingEmpty}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-mist">
              {hasHistory ? (
                <>
                  <span className="md:hidden">{t.count(results.length)}</span>
                  <span className="max-md:hidden">{t.summary(results.length)}</span>
                </>
              ) : t.empty}
            </p>
            {hasHistory && (
              <div className="mt-3 flex flex-wrap gap-x-6">
                <TextLink href={href(locale, "/my/shares")} prefetch={false}>{shareMessages[locale].myShares}</TextLink>
                <TextLink href={href(locale, "/my/pairing")} prefetch={false}>{pairingUiMessages[locale].center}</TextLink>
              </div>
            )}
          </div>
          {/* With records, phones move the retest to the end of the list: the reports come first. */}
          <PrimaryButton href={href(locale, "/quiz")} className={cn("md:w-56 md:shrink-0", hasHistory && "max-md:hidden")} {...trackAttrs("start_quiz", "page_cta")}>{hasHistory ? t.continue : t.start}</PrimaryButton>
        </section>
        {hasHistory ? (
          <>
            <section className="mt-6 flex flex-col md:mt-10 md:gap-10" aria-label={t.listLabel}>
              {results.map((result) => <HistoryItem key={result.id} result={result} locale={locale} />)}
            </section>
            <PrimaryButton href={href(locale, "/quiz")} className="mt-8 max-w-xl md:hidden" {...trackAttrs("start_quiz", "page_cta")}>{t.continue}</PrimaryButton>
            {elsewhereLink && <p className="mt-6">{elsewhereLink}</p>}
            <p className="mt-7 max-w-2xl text-xs text-mist">
              {t.keepOrders}
            </p>
            <Accordion type="single" collapsible className="mt-4 max-w-[560px]" defaultValue={recoverOpen ? "recover" : undefined}>
              <AccordionItem value="recover">
                <AccordionTrigger {...trackAttrs("recover_other", "page_cta")}>{t.recoverOther}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-6 text-sm text-mist">{t.recoverSwitch}</p>
                  <RecoverReports />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <section className="mt-6 max-w-[560px]">
            {elsewhereLink && <p className="mb-3">{elsewhereLink}</p>}
            <TextLink href={href(locale, "/result/sample")} {...trackAttrs("view_sample_result", "page_cta")}>{t.sample}</TextLink>
            {/* Most people arriving here simply haven't taken a test yet; recovery is for the few who switched devices. */}
            <Accordion type="single" collapsible className="mt-6" defaultValue={recoverOpen ? "recover" : undefined}>
              <AccordionItem value="recover">
                <AccordionTrigger {...trackAttrs("recover_other", "page_cta")}>{t.recoveryHeading}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-6 text-sm text-mist">{t.recoveryText}</p>
                  <RecoverReports />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        )}
      </main>
      <TrackView event="my_report_view" params={{ record_count: results.length, unlocked_count: results.filter((result) => result.unlocked).length }} />
    </>
  );
}

/**
 * A record taken in this page's language; the page lists no other. Its type, the report's four chapter
 * covers and the four scores, then its actions as the card's foot (owner, 2026-09-29: "美观大气", with no
 * summary, no mark and nothing that repeats the result page). Phones and tablets stack them; from 1101px
 * the covers stand to the right, with the type above the scores on the left.
 */
function HistoryItem({ result, locale }: { result: ResultHistoryItem; locale: Locale }) {
  const t = pageMessages[locale].history;
  const { profile, order, unlocked, createdAt } = result;
  const { name, typeLabel } = profileMeta(profile, locale);
  const poles = polesFor(locale);
  const dateFormat = new Intl.DateTimeFormat(t.dateLocale, {
    timeZone: t.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return (
    // Phones list the records flat between rules, so the covers take the full width; boxed cards from 721px.
    <article aria-label={t.recordLabel(typeLabel)} className="border-t border-line pt-10 last:border-b md:border md:bg-card md:px-10 md:pt-9">
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:grid-rows-[auto_1fr] xl:gap-x-12">
        <div className="xl:col-start-1 xl:row-start-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-5xl leading-none font-medium tracking-tighter md:text-6xl">{typeLabel}</h2>
            <TypeName name={name} className="text-sm text-mist" />
          </div>
          <p className="mt-3 text-xs text-mist">
            {createdAt && <><time dateTime={createdAt.toISOString()}>{dateFormat.format(createdAt)}</time> · </>}
            {t.version(questionnaireName(result.questionnaireId, locale) ?? pageMessages[locale].result.legacyVersion, result.questionCount)}
          </p>
        </div>
        <ReportPages id={result.id} profile={profile} unlocked={unlocked} locale={locale} className="mt-7 max-w-xl xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:mt-0 xl:max-w-none" />
        {/* Phones give each score a line, the trait on the left and the score on the right; from 721px the four share one row. */}
        <dl className="mt-6 max-w-xl md:mt-7 md:grid md:max-w-md md:grid-cols-4 xl:col-start-1 xl:row-start-2 xl:mt-8 xl:self-end">
          {profile.type.split("").map((letter, i) => (
            <div key={letter} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 first:border-t md:flex-col md:items-center md:justify-start md:gap-1 md:border-b-0 md:py-0 md:first:border-t-0 md:not-first:border-l">
              <dt className="text-sm text-mist md:text-xs">{poles[letter as Letter].label}</dt>
              {/* A near-even score in the warm ink the result page gives it. */}
              <dd className={profile.balanced[i] ? "text-xl text-warm-ink" : "text-xl"}>{profile.values[i]}<span className="text-xs">%</span></dd>
            </div>
          ))}
        </dl>
      </div>
      {/* Phones: a compact pill (a full-width bar per record stacked up), its links on the line below at every width. From 721px one row, the card's foot. */}
      <div className={cn("mt-6 flex flex-col items-start gap-2 md:mt-9 md:flex-row md:items-center md:gap-8 md:border-t md:border-line md:py-6", order ? "pb-6" : "pb-10")}>
        <PrimaryButton href={href(locale, unlocked ? `/report/${result.id}` : `/result/${result.id}`)} prefetch={false} className="max-md:min-h-11 max-md:w-auto max-md:gap-5 max-md:px-5 md:w-[240px]" {...trackAttrs(unlocked ? "read_report" : "view_result", "history_item")}>
          {unlocked ? t.readDetailed : t.viewBrief}
        </PrimaryButton>
        <div className="flex flex-wrap items-center gap-x-6 md:contents">
          <TextLink href={href(locale, unlocked ? `/result/${result.id}` : `/result/${result.id}?unlock=1`)} prefetch={false} {...trackAttrs(unlocked ? "view_result" : "unlock_report", "history_item")}>
            {unlocked ? t.viewBrief : t.unlock}
          </TextLink>
          {unlocked && <PairingTracker resultId={result.id} surface="my_pairing"><TextLink href={href(locale, `/my/pairing?result=${result.id}`)} prefetch={false}>{pairingUiMessages[locale].invite}</TextLink></PairingTracker>}
        </div>
      </div>
      {/* The record's space below it comes after its order fold, so the fold stays with its record. */}
      {order && (
        <Accordion type="single" collapsible className="pb-8 md:pb-2">
          <AccordionItem value="order">
            <AccordionTrigger {...trackAttrs("order_receipt", "history_item")}>{t.orderAccordion}</AccordionTrigger>
            <AccordionContent><OrderReceipt orderId={order.id} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </article>
  );
}
