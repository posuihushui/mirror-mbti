import { Check, Gift, LockSimple, Scales, Timer } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { categoryMirrorProfile, MirrorMark, type MirrorProfile } from "@/components/brand/mirror-mark";
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
  /** `aside`: the desktop sidebar under the chapter list; the others close chapter 03 and chapter 04. */
  variant: "aside" | "relationship" | "closing";
  /** The invite price with its currency, as whoever the reader invites would pay it for a first report. */
  invitePrice: string;
  /** The reader's invite code and link. */
  invite?: { code: string; url: string } | null;
};

type Dimension = keyof CompareCategories;

/** The midpoint mark: the brand's own mirror, standing in for someone not yet here. */
const unknown: MirrorProfile = { type: "ESTJ", values: [50, 50, 50, 50] };

/** Two mirrors facing each other: the reader's, and theirs once a guide exists (a faint stand-in until then). */
function PairMarks({ you, partner, labels, size, className }: { you: MirrorProfile; partner: MirrorProfile | null; labels: [string, string]; size: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3", className)}>
      <span className="flex flex-col items-center gap-1.5">
        <MirrorMark profile={you} size={size} />
        <span className="text-xs text-mist">{labels[0]}</span>
      </span>
      <span className="relative -mt-5 h-px w-10 border-t border-dashed border-warm md:w-14">
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm" />
      </span>
      <span className="flex flex-col items-center gap-1.5">
        <MirrorMark profile={partner ?? unknown} size={size} className={partner ? undefined : "opacity-25"} />
        <span className="text-xs text-mist">{labels[1]}</span>
      </span>
    </div>
  );
}

/** The reader's category on each dimension, in the guide's terms: a side, or near-even. */
function categoriesOf(profile: Profile) {
  return Object.fromEntries(dimensions.map((dimension, i) => [dimension, profile.balanced[i] ? "balanced" : profile.type[i]])) as CompareCategories;
}

/** Where a category sits on its pair's line, as the guide places it: a side's end, or the middle. */
function position(category: string, dimension: string) {
  return category === dimension[0] ? 6 : category === dimension[1] ? 94 : 50;
}

/**
 * The guide's four lines with the reader already on them: one row for you, one for them. Their row
 * stays dashed with a question mark until a guide exists, so the card shows what the other person's
 * answers would add. Sides only, never strength, the same as the guide itself.
 */
function PairLines({ locale, you, them }: { locale: Locale; you: CompareCategories; them: CompareCategories | null }) {
  const c = compareMessages[locale];
  const t = pairingUiMessages[locale].reportInvite;
  const names = (categories: CompareCategories) => dimensions.map((dimension) => c.categoryLabels[categories[dimension]]).join(locale === "en" ? ", " : "、");
  const row = (who: "you" | "them", category: string | null, dimension: Dimension) => (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center">
      <span className="text-xs text-mist">{who === "you" ? t.you : t.them}</span>
      <span className="relative h-5">
        {category
          ? <>
              <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
              <span className="absolute top-1/2 left-1/2 h-2 w-px -translate-y-1/2 bg-line" />
              <span
                className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full", who === "them" ? "border-2 border-warm bg-card" : "bg-ink ring-2 ring-card")}
                style={{ left: `${position(category, dimension)}%` }}
              />
            </>
          : <>
              <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-mist/50" />
              <span className="absolute top-1/2 left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-warm-ink bg-card text-xs text-warm-ink">?</span>
            </>}
      </span>
    </div>
  );
  return (
    <figure data-pair-lines>
      <p className="sr-only">{them ? t.lines.srKnown(names(you), names(them)) : t.lines.sr(names(you))}</p>
      <div aria-hidden className="grid grid-cols-2 gap-x-5 gap-y-6 md:gap-x-10">
        {dimensions.map((dimension) => (
          <div key={dimension} className="min-w-0">
            <p className="text-sm font-medium">{c.themes[dimension]}</p>
            <div className="mt-2 flex justify-between gap-2 pl-[2.75rem] text-xs text-mist">
              <span><span className="hidden md:inline">{c.categoryLabels[dimension[0] as keyof typeof c.categoryLabels]} </span>{dimension[0]}</span>
              <span><span className="hidden md:inline">{c.categoryLabels[dimension[1] as keyof typeof c.categoryLabels]} </span>{dimension[1]}</span>
            </div>
            <div className="mt-1 space-y-1">
              {row("you", you[dimension], dimension)}
              {row("them", them ? them[dimension] : null, dimension)}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-5 text-sm text-mist">{them ? t.lines.legendKnown : t.lines.legend}</figcaption>
    </figure>
  );
}

/**
 * What the guide adds, shown with the reader's own material rather than promised: the emphasis the
 * guide would lead with if the two of you differed on the reader's clearest dimension, and what it
 * would suggest between partners: the line to open with in chapter 03, the practice in chapter 04.
 */
function Gains({ locale, profile, variant }: { locale: Locale; profile: Profile; variant: "relationship" | "closing" }) {
  const c = compareMessages[locale];
  const t = pairingUiMessages[locale].reportInvite;
  const clearest = dimensions.map((_, i) => i).filter((i) => !profile.balanced[i]).sort((a, b) => profile.values[b] - profile.values[a])[0] ?? 0;
  const dimension = dimensions[clearest];
  return (
    <div>
      <h3 className="text-xl">{t.gainsTitle}</h3>
      <ol className="mt-5 border-t border-line">
        {t.gains.map((gain, i) => (
          <li key={gain.title} className="grid gap-x-8 gap-y-2 border-b border-line py-5 md:grid-cols-[13rem_minmax(0,1fr)]">
            <p className="flex gap-3 text-base font-medium">
              <span aria-hidden className="pt-0.5 text-xs text-warm-ink">0{i + 1}</span>
              {gain.title}
            </p>
            <div className="min-w-0 pl-7 md:pl-0">
              <p className="text-sm text-slate">{gain.body}</p>
              {i === 0 && <p className="mt-3 border-l-2 border-warm pl-4 text-base text-ink"><span className="text-mist">{t.gainExample(c.themes[dimension])}</span>{c.highlights.opposite[dimension]}</p>}
              {i === 1 && (
                <div className="mt-3">
                  <p className="text-xs text-mist">{variant === "closing" ? t.gainPracticeLabel(c.relationshipBetween.partner) : t.gainSayLabel(c.relationshipBetween.partner)}</p>
                  {variant === "closing"
                    ? <p className="mt-1.5 border-l-2 border-warm pl-4 text-base text-ink">{c.byRelationship.partner.practices[dimension]}</p>
                    : <p className="mt-1.5 rounded-[16px] rounded-bl-[4px] border border-line bg-paper px-4 py-3 text-base text-ink">“{c.byRelationship.partner.openingLines[dimension]}”</p>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** What inviting asks of the other person, answered before the reader has to wonder. */
function Assurances({ locale, price, invitePrice }: { locale: Locale; price: string; invitePrice: string }) {
  const t = pairingUiMessages[locale].reportInvite;
  const icons = [Timer, LockSimple, Scales];
  const items = [...t.assures.map((item, i) => ({ ...item, Icon: icons[i] })), { title: t.giftTitle(price), body: t.giftAssure(invitePrice), Icon: Gift }];
  return (
    <div>
      <h3 className="text-xl">{t.assureTitle}</h3>
      <ul className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {items.map(({ title, body, Icon }) => (
          <li key={title} className="flex gap-3">
            <Icon size={22} weight="light" aria-hidden className="mt-0.5 shrink-0 text-warm-ink" />
            <div className="min-w-0">
              <p className="text-base font-medium">{title}</p>
              <p className="mt-1 text-sm text-slate">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The paid report's way to its guide for two. Before anyone is invited it explains itself from the
 * reader's side: their half is on the guide's four lines and the other half is blank, then what the
 * guide would say (with the reader's own material), then what inviting asks of the other person, and
 * only then who to invite. Once invited, the same card tracks the three steps; once a guide exists,
 * it fills the other row and leads there.
 */
export function ReportInvite({ locale, resultId, profile, status, checkout, variant, invitePrice, invite }: Props) {
  const t = pairingUiMessages[locale].reportInvite;
  const location = variant === "aside" ? "report_aside" : "report_invite";
  const reached = status.guides ? 3 : status.invitations.length ? 1 : 0;
  const state = status.guides ? "ready" : reached ? "waiting" : "start";
  const partner = status.partner ? categoryMirrorProfile([status.partner.EI, status.partner.SN, status.partner.TF, status.partner.JP]) : null;
  const labels: [string, string] = [`${t.you} · ${profile.type}`, partner ? t.them : status.invitations.length ? t.waitingThem : t.them];
  const price = `${paymentMessages[locale].currency}${checkout.priceLabel}`;
  const island = (kind: "aside" | "panel") => (
    <ReportPairing resultId={resultId} locale={locale} checkout={checkout} availableGifts={status.availableGifts} invitations={status.invitations} variant={kind} resume={variant === "closing"} />
  );
  const guide = status.guide && (
    <PrimaryButton href={status.guide} prefetch={false} className={variant === "aside" ? "min-h-11 px-4 text-sm" : "md:w-auto md:min-w-64"} {...trackAttrs("read_guide", location)}>{t.readGuide}</PrimaryButton>
  );

  const steps = (
    <ol className={cn(variant === "aside" ? "mt-4 space-y-2.5" : "mt-8 grid gap-3 md:grid-cols-3 md:gap-0")}>
      {t.steps.map((step, i) => {
        const done = i < reached;
        return (
          <li key={step} className={cn("flex items-center gap-3", variant !== "aside" && "md:relative md:pr-4")}>
            <span aria-hidden className={cn("relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs", done ? "border-warm bg-warm text-paper" : "border-line bg-paper text-warm-ink")}>
              {done ? <Check size={13} weight="bold" /> : i + 1}
            </span>
            <span className={cn("text-sm", done ? "text-mist" : "font-medium")}>{step}{done && <span className="sr-only"> · {t.done}</span>}</span>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "aside") {
    return (
      <PairingTracker resultId={resultId} surface="report">
        <section data-report-invite="aside" aria-label={t.eyebrow} className="mt-10">
          <PairMarks you={profile} partner={partner} labels={labels} size={36} />
          <p className="eyebrow mt-5 text-warm-ink">{t.eyebrow}</p>
          <p className="mt-2 text-base font-medium">{state === "ready" ? t.ready(status.guides) : state === "waiting" ? t.waiting(status.invitations.length) : t.asideHeading}</p>
          {state === "start" ? <p className="mt-2 text-sm text-slate">{t.asideLine}</p> : steps}
          <div className="mt-5 space-y-3">
            {guide}
            {island("aside")}
          </div>
        </section>
      </PairingTracker>
    );
  }

  const heading = state === "start" ? t.headings[variant] : t.headings[state];
  const lead = state === "start" ? t.leads[variant] : state === "waiting" && status.invitations.every((item) => item.covered) ? t.bodies.covered : t.bodies[state];
  return (
    <PairingTracker resultId={resultId} surface="report">
      <section data-report-invite={variant} data-report-invite-state={state} aria-labelledby={`report-invite-${variant}`} className="my-10 bg-card">
        <div className="p-5 md:p-8">
          <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
          <h2 id={`report-invite-${variant}`} className="mt-3 text-2xl whitespace-pre-line md:text-3xl">{heading}</h2>
          <p className="mt-4 max-w-xl text-base text-slate">{lead}</p>
          <div className="mt-8"><PairLines locale={locale} you={categoriesOf(profile)} them={status.partner} /></div>
          {state !== "start" && steps}
          {guide && <div className="mt-8">{guide}</div>}
        </div>
        {state === "start" && (
          <>
            <div className="border-t border-line p-5 md:p-8"><Gains locale={locale} profile={profile} variant={variant} /></div>
            <div className="border-t border-line p-5 md:p-8"><Assurances locale={locale} price={price} invitePrice={invitePrice} /></div>
          </>
        )}
        <div className="border-t border-line p-5 md:p-8">
          {island("panel")}
          {state !== "start" && <p className="mt-6 text-xs text-mist">{pairingMessages[locale].feeRule}</p>}
        </div>
        {invite && <div className="border-t border-line p-5 md:p-8"><InviteLink locale={locale} code={invite.code} url={invite.url} invitePrice={invitePrice} /></div>}
      </section>
    </PairingTracker>
  );
}
