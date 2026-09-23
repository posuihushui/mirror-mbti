import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { Metadata } from "next";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { TrackView } from "@/components/analytics/track-view";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { OrderReceipt } from "@/components/payment/order-receipt";
import { RecoverReports } from "@/components/report/recover-reports";
import { trackAttrs } from "@/lib/analytics/events";
import { href, type Locale } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, profileMeta, type Letter } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";
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
  const results = visitorId ? await resultsForVisitor(visitorId) : [];
  const hasHistory = results.length > 0;
  // `/help` links here with `?recover=1`, so someone who came to recover lands with the form open.
  const recoverOpen = (await searchParams).recover === "1";

  return (
    <>
      <AppHeader variant="page" title={t.title} backHref={href(locale, "/")} path="/my/report" />
      <main className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:px-10 md:pt-14">
        <section className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
            <h1 className="mt-4 text-3xl leading-heading md:text-4xl">
              {hasHistory ? t.headingHas : t.headingEmpty}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-mist">
              {hasHistory ? t.summary(results.length) : t.empty}
            </p>
            {hasHistory && (
              <div className="mt-3 flex flex-wrap gap-x-6">
                <TextLink href={href(locale, "/my/shares")} prefetch={false}>{shareMessages[locale].myShares}</TextLink>
                <TextLink href={href(locale, "/my/pairing")} prefetch={false}>{pairingUiMessages[locale].center}</TextLink>
              </div>
            )}
          </div>
          <PrimaryButton href={href(locale, "/quiz")} className="md:w-56 md:shrink-0" {...trackAttrs("start_quiz", "page_cta")}>{hasHistory ? t.continue : t.start}</PrimaryButton>
        </section>
        {hasHistory ? (
          <>
            <section className="mt-8 flex flex-col gap-6 md:mt-10" aria-label={t.listLabel}>
              {results.map((result) => <HistoryItem key={result.id} result={result} locale={locale} />)}
            </section>
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
    <article aria-label={t.recordLabel(typeLabel)} className="border border-line bg-card px-6 py-6 md:px-8 md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {createdAt && <time dateTime={createdAt.toISOString()} className="text-xs text-mist">{dateFormat.format(createdAt)}</time>}
        <Badge variant={unlocked ? "unlocked" : "tag"}>{unlocked ? t.unlocked(demo) : t.brief}</Badge>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-4xl leading-none font-medium tracking-tighter md:text-5xl">{typeLabel}</h2>
            <TypeName name={name} className="text-sm text-mist" />
          </div>
          <p className="mt-2 text-xs text-mist">{t.version(questionnaireName(result.questionnaireId, locale) ?? pageMessages[locale].result.legacyVersion, result.questionCount)}</p>
        </div>
        <MirrorMark profile={profile} size={64} className="shrink-0" />
      </div>
      <p className="mt-4 max-w-[680px] text-sm text-slate">{summary}</p>
      <dl className="mt-6 grid grid-cols-4 border-y border-line py-4">
        {profile.type.split("").map((letter, i) => (
          <div key={letter} className="flex flex-col items-center gap-1 px-1 text-center not-first:border-l not-first:border-line">
            <dt className="text-xs text-mist">{poles[letter as Letter].label} {letter}</dt>
            <dd className="text-xl">{profile.values[i]}<span className="text-xs">%</span></dd>
            <dd className={profile.balanced[i] ? "text-xs text-warm-ink" : "text-xs text-mist"}>{dimensionReading(profile, i, locale).degree}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
        <PrimaryButton href={href(own, unlocked ? `/report/${result.id}` : `/result/${result.id}`)} prefetch={false} className="md:w-[240px]" {...trackAttrs(unlocked ? "read_report" : "view_result", "history_item")}>
          {unlocked ? t.readDetailed : t.viewBrief}
        </PrimaryButton>
        <TextLink href={href(own, unlocked ? `/result/${result.id}` : `/result/${result.id}?unlock=1`)} prefetch={false} {...trackAttrs(unlocked ? "view_result" : "unlock_report", "history_item")}>
          {unlocked ? t.viewBrief : t.unlock}
        </TextLink>
        {unlocked && <PairingTracker resultId={result.id} surface="my_pairing"><TextLink href={href(own, `/my/pairing?result=${result.id}`)} prefetch={false}>{pairingUiMessages[locale].invite}</TextLink></PairingTracker>}
      </div>
      {order && (
        <Accordion type="single" collapsible className="mt-5">
          <AccordionItem value="order">
            <AccordionTrigger {...trackAttrs("order_receipt", "history_item")}>{t.orderAccordion(demo)}</AccordionTrigger>
            <AccordionContent><OrderReceipt orderId={order.id} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </article>
  );
}
