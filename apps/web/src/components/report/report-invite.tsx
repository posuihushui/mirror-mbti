import { BookOpenText, CaretDown, Check, Gift, LockSimple, PaperPlaneTilt, Scales, Timer, UserCircleCheck } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { categoryMirrorProfile } from "@/components/brand/mirror-mark";
import { PairLines, PairMarks } from "@/components/pairing/pair-figures";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import type { GiftCheckout } from "@/components/pairing/gift-offer";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import type { CompareCategories, CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { paymentMessages } from "@/lib/i18n/messages/payment";
import { dimensions, type Profile } from "@/lib/personality";
import { InviteLink } from "./invite-link";
import { ReportPairing, type ReportInvitation } from "./report-pairing";

/** Where this result's guide for two stands (`resultPairingStatus`). */
export type PairingStatus = {
  invitations: ReportInvitation[];
  guides: number;
  guide: string | null;
  partner: CompareSnapshot["categories"] | null;
  availableGifts: number;
};

type Props = {
  locale: Locale;
  resultId: string;
  /** The reader's own result. */
  profile: Profile;
  status: PairingStatus;
  checkout: Omit<GiftCheckout, "available">;
  /** The invite price with its currency, as whoever the reader invites would pay it for a first report. */
  invitePrice: string;
  /** The reader's invite code and link. */
  invite?: { code: string; url: string } | null;
};

/** The reader's category on each dimension, in the guide's terms: a side, or near-even. */
export function categoriesOf(profile: Profile) {
  return Object.fromEntries(dimensions.map((dimension, i) => [dimension, profile.balanced[i] ? "balanced" : profile.type[i]])) as CompareCategories;
}

/**
 * What the guide adds, shown with the reader's own material rather than promised: the emphasis the
 * guide would lead with if the two of you differed on the reader's clearest dimension, and the line a
 * partner might open with. Two cards, each a promise and its example.
 */
function Gains({ locale, profile }: { locale: Locale; profile: Profile }) {
  const c = compareMessages[locale];
  const t = pairingUiMessages[locale].reportInvite;
  const clearest = dimensions.map((_, i) => i).filter((i) => !profile.balanced[i]).sort((a, b) => profile.values[b] - profile.values[a])[0] ?? 0;
  const dimension = dimensions[clearest];
  return (
    <section aria-labelledby="guide-gains">
      <h3 id="guide-gains" className="text-xl">{t.gainsTitle}</h3>
      <ol className="mt-5 grid gap-3 md:grid-cols-2">
        {t.gains.map((gain, i) => (
          <li key={gain.title} className="flex flex-col bg-card p-5 md:p-6">
            <p className="flex gap-3 text-base font-medium">
              <span aria-hidden className="pt-0.5 text-xs text-warm-ink">0{i + 1}</span>
              {gain.title}
            </p>
            <p className="mt-2 text-sm text-mist">{gain.body}</p>
            {i === 0
              ? <p className="mt-4 border-l-2 border-warm pl-4 text-base text-ink"><span className="text-mist">{t.gainExample(c.themes[dimension])}</span>{c.highlights.opposite[dimension]}</p>
              : (
                <div className="mt-4">
                  <p className="text-xs text-mist">{t.gainSayLabel(c.relationshipBetween.partner)}</p>
                  <p className="mt-1.5 rounded-[16px] rounded-bl-[4px] border border-line bg-paper px-4 py-3 text-base text-ink">“{c.byRelationship.partner.openingLines[dimension]}”</p>
                </div>
              )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * What inviting asks of the other person, answered before the reader has to wonder: four icon tiles
 * whose titles carry the answer, each unfolding to its detail (the text stays in the HTML).
 */
function Assurances({ locale, price, invitePrice }: { locale: Locale; price: string; invitePrice: string }) {
  const t = pairingUiMessages[locale].reportInvite;
  const icons = [Timer, LockSimple, Scales];
  const items = [...t.assures.map((item, i) => ({ ...item, Icon: icons[i] })), { title: t.giftTitle(price), body: t.giftAssure(invitePrice), Icon: Gift }];
  return (
    <section aria-labelledby="guide-assures">
      <h3 id="guide-assures" className="text-xl">{t.assureTitle}</h3>
      <ul className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        {items.map(({ title, body, Icon }) => (
          <li key={title} className="min-w-0 rounded-[4px] border border-line bg-card">
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-2 p-3 md:p-4 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-2">
                  <Icon size={22} weight="light" aria-hidden className="shrink-0 text-warm-ink" />
                  <CaretDown size={12} aria-hidden className="mt-1 shrink-0 text-mist transition-transform group-open:rotate-180" />
                </span>
                <span className="text-sm leading-snug font-medium">{title}</span>
              </summary>
              <p className="px-3 pb-3 text-sm text-slate md:px-4 md:pb-4">{body}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The way to a guide in three stops on one line: invite them, they take the free test, the guide
 * opens. `reached` stops are ticked and the next one is ringed warm. The sample shows the path
 * with nothing reached.
 */
export function GuideSteps({ steps, reached, locale, kind = "report" }: { steps: readonly string[]; reached: number; locale: Locale; kind?: "report" | "public" | "invitee" }) {
  const t = pairingUiMessages[locale].reportInvite;
  // The report's way starts by inviting; the public way (the sample's) starts by knowing yourself;
  // an invited reader's way starts with the free test.
  const icons = kind === "report" ? [PaperPlaneTilt, UserCircleCheck, BookOpenText] : kind === "invitee" ? [Timer, UserCircleCheck, BookOpenText] : [UserCircleCheck, PaperPlaneTilt, BookOpenText];
  return (
    <ol className="relative grid grid-cols-3 gap-2">
      <span aria-hidden className="absolute top-5 right-[16.7%] left-[16.7%] h-px bg-line" />
      <span aria-hidden className="absolute top-5 left-[16.7%] h-px bg-warm transition-[width]" style={{ width: `${Math.min(reached, 2) * 33.3}%` }} />
      {steps.map((step, i) => {
        const done = i < reached;
        const current = i === reached;
        const Icon = icons[i];
        return (
          <li key={step} className="relative flex flex-col items-center gap-2 text-center">
            <span aria-hidden className={cn(
              "flex size-10 items-center justify-center rounded-full border",
              done ? "border-warm bg-warm text-paper" : current ? "border-warm bg-paper text-warm-ink ring-4 ring-warm/15" : "border-line bg-paper text-mist",
            )}>
              {done ? <Check size={16} weight="bold" /> : <Icon size={18} weight="light" />}
            </span>
            <span className={cn("text-xs leading-snug text-balance", done ? "text-mist" : "font-medium text-ink")}>
              {step}{done && <span className="sr-only"> · {t.done}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Where the reader's guide stands, and the tab cover's words for it. */
export function guideCover(locale: Locale, status: PairingStatus) {
  const t = pairingUiMessages[locale].reportInvite;
  const state = status.guides ? "ready" as const : status.invitations.length ? "waiting" as const : "start" as const;
  const lead = state === "start" ? t.tabLead
    : state === "waiting" ? (status.invitations.every((item) => item.covered) ? t.bodies.covered : t.bodies.waiting)
    : t.bodies.ready;
  return { state, heading: t.headings[state === "start" ? "relationship" : state], lead };
}

/**
 * The paid report's guide for two, as a tab of its own. Before anyone is invited it leads with the
 * way (three stops) and the reader's half drawn on the guide's four lines, then shows what the guide
 * would say with the reader's own material, answers what inviting asks of the other person, and only
 * then asks who (four pictured relationships). Once invited, the way and the open invitations lead;
 * once a guide exists, reading it leads and the other row is filled. The invite code closes the tab.
 */
export function ReportGuideContent({ locale, resultId, profile, status, checkout, invitePrice, invite }: Props) {
  const t = pairingUiMessages[locale].reportInvite;
  const { state } = guideCover(locale, status);
  const reached = status.guides ? 3 : status.invitations.length ? 1 : 0;
  const partner = status.partner ? categoryMirrorProfile([status.partner.EI, status.partner.SN, status.partner.TF, status.partner.JP]) : null;
  const price = `${paymentMessages[locale].currency}${checkout.priceLabel}`;
  const island = (variant: "quick" | "panel") => (
    <ReportPairing resultId={resultId} locale={locale} checkout={checkout} availableGifts={status.availableGifts} invitations={status.invitations} variant={variant} resume={variant === "panel"} />
  );
  const halves = (
    <section aria-labelledby="guide-halves" className="bg-card p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 id="guide-halves" className="text-xl">{t.halvesTitle}</h3>
        <PairMarks you={profile} partner={partner} labels={[`${t.you} · ${profile.type}`, partner ? t.them : status.invitations.length ? t.waitingThem : t.them]} size={44} />
      </div>
      <div className="mt-6"><PairLines locale={locale} you={categoriesOf(profile)} them={status.partner} /></div>
    </section>
  );
  const start = state === "start";
  // Every block keeps its place in the tree whatever the state, and only its visual `order` moves:
  // inviting refreshes the page into the waiting state, and a moved island would remount and lose
  // the 请 TA sheet it is about to open.
  return (
    <PairingTracker resultId={resultId} surface="report">
      <div data-report-invite="tab" data-report-invite-state={state} className="flex flex-col gap-10 md:gap-12">
        {/* The way, and the one action that moves along it. */}
        <section aria-label={t.eyebrow} className="order-1 border-y border-line py-6">
          <GuideSteps steps={t.steps} reached={reached} locale={locale} />
          <div className="mt-6 flex flex-col items-center gap-3">
            {status.guide
              ? <PrimaryButton href={status.guide} prefetch={false} className="md:w-auto md:min-w-72" {...trackAttrs("read_guide", "report_invite")}>{t.readGuide}</PrimaryButton>
              : island("quick")}
          </div>
        </section>
        <div className={start ? "order-2" : "order-4"}>{halves}</div>
        {start && <div className="order-3"><Gains locale={locale} profile={profile} /></div>}
        {start && <div className="order-4"><Assurances locale={locale} price={price} invitePrice={invitePrice} /></div>}
        <section className={start ? "order-5" : "order-2"}>
          {island("panel")}
          {!start && <p className="mt-6 text-xs text-mist">{pairingMessages[locale].feeRule}</p>}
        </section>
        {invite && <div className="order-6 border-t border-line pt-8"><InviteLink locale={locale} code={invite.code} url={invite.url} invitePrice={invitePrice} /></div>}
      </div>
    </PairingTracker>
  );
}
