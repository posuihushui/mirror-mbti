import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { CompareUnavailable } from "@/components/compare/compare-unavailable";
import { CompareConsent } from "@/components/compare/compare-consent";
import { ContinuationAction } from "@/components/pairing/continuation-action";
import { AccessActions } from "@/components/pairing/access-actions";
import { getPublicInvitation, getInvitationState, findOwnedComparisonForInvitation, getComparisonResult, listComparisonResults } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { getLocale } from "@/lib/i18n/server";
import { href } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { questionnaireName } from "@/lib/questionnaires";
import { appUrl } from "@/lib/env";
type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ result?: string }> };
export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); const title = pairingMessages[locale].title; const image = appUrl() + href(locale, "/opengraph-image"); return { title, robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: null, languages: {} }, openGraph: { title: "mirror", images: [image] }, twitter: { title: "mirror", images: [image], card: "summary_large_image" } }; }
export default async function JoinPage({ params, searchParams }: Props) {
  const { token } = await params; const { result } = await searchParams; const locale = await getLocale(); const visitor = await getVisitorId();
  const existing = visitor ? await findOwnedComparisonForInvitation(token, visitor) : null; if (existing) redirect(existing.url);
  const invitation = await getPublicInvitation(token); if (!invitation) return <CompareUnavailable locale={locale} legacy={await getInvitationState(token) === "legacy"} />;
  const m = compareMessages[locale]; const p = pairingMessages[locale]; const ui = pairingUiMessages[locale];
  const selected = result && visitor ? await getComparisonResult(result, visitor) : null;
  if (result && !selected) return <CompareUnavailable locale={locale} />;
  const choices = !selected && visitor ? await listComparisonResults(visitor) : [];
  return <><AppHeader variant="page" title={p.title} backHref={href(locale, `/t/${token}`)} /><main data-share-static className="mx-auto max-w-[680px] px-6 py-8 md:py-14"><h1 className="mb-7 text-3xl leading-[1.3]">{selected ? ui.continue : m.chooseResult}</h1>{(selected || choices.length > 0) && <p className="mb-5 text-sm">{p.feeRule}</p>}{selected ? <><TextLink href={href(selected.locale, `/result/${selected.id}?compare=${token}`)} prefetch={false} className="mb-5">{ui.readResult}</TextLink>{selected.eligibility === "eligible" ? <CompareConsent key={selected.id} kind="guest" invitationToken={token} resultId={selected.id} snapshot={selected.snapshot} locale={locale} /> : selected.eligibility === "syncing" ? <AccessActions resultId={selected.id} locale={locale} surface="result" /> : <section><p className="mb-5 text-sm">{ui.continueAfterUnlock}</p><ContinuationAction invitationToken={token} resultId={selected.id} resultLocale={selected.locale} locale={locale} toResult>{ui.readResult}</ContinuationAction></section>}</> : <><p className="mb-6 text-sm">{ui.continuationNote}</p><ul className="space-y-4">{choices.map(item => <li key={item.id} className="border border-line p-5"><p className="text-sm">{questionnaireName(item.snapshot.questionnaireId, locale)} · <time dateTime={item.snapshot.createdAt}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(item.snapshot.createdAt))}</time></p><p className="my-4 text-xs">{item.eligibility === "eligible" ? ui.unlocked : item.eligibility === "syncing" ? ui.syncing : ui.locked}</p><ContinuationAction invitationToken={token} resultId={item.id} resultLocale={item.locale} locale={locale} toResult>{ui.choose}</ContinuationAction></li>)}</ul>{!choices.length && <p className="my-5 text-sm">{m.noResults}</p>}<PrimaryButton href={href(locale, `/quiz?compare=${token}`)} prefetch={false} className="mt-7 md:max-w-xs">{ui.start}</PrimaryButton></>}</main></>;
}
