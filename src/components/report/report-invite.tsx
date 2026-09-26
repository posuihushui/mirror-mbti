import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { categoryMirrorProfile, MirrorMark, type MirrorProfile } from "@/components/brand/mirror-mark";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import type { GiftCheckout } from "@/components/pairing/gift-offer";
import { PrimaryButton } from "@/components/site/primary-button";
import { trackAttrs } from "@/lib/analytics/events";
import type { CompareSnapshot } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { paymentMessages } from "@/lib/i18n/messages/payment";
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
  /** The reader's own mark. */
  profile: MirrorProfile;
  status: PairingStatus;
  checkout: Omit<GiftCheckout, "available">;
  /** `aside`: the desktop sidebar under the chapter list; the others close chapter 03 and chapter 04. */
  variant: "aside" | "relationship" | "closing";
};

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

/**
 * The paid report's way to its guide for two: who to read it with, the three steps (invite them →
 * they take the free test → unlock your guide), and 请 TA, all on the report itself. The steps tick
 * off and the card's heading moves on as the result gets there; once a guide exists, it leads there.
 */
export function ReportInvite({ locale, resultId, profile, status, checkout, variant }: Props) {
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
    <ol className={cn(variant === "aside" ? "mt-4 space-y-2.5" : "mt-6 grid gap-3 md:grid-cols-3 md:gap-0")}>
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
          {steps}
          <div className="mt-5 space-y-3">
            {guide}
            {island("aside")}
          </div>
        </section>
      </PairingTracker>
    );
  }

  const heading = state === "start" ? t.headings[variant] : t.headings[state];
  return (
    <PairingTracker resultId={resultId} surface="report">
      <section data-report-invite={variant} data-report-invite-state={state} aria-labelledby={`report-invite-${variant}`} className="my-10 bg-card">
        <div className="p-5 md:p-8">
          <div className="flex flex-col-reverse gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
              <h2 id={`report-invite-${variant}`} className="mt-3 text-2xl whitespace-pre-line md:text-3xl">{heading}</h2>
            </div>
            <PairMarks you={profile} partner={partner} labels={labels} size={56} className="shrink-0" />
          </div>
          <p className="mt-4 max-w-xl text-sm text-slate">{state === "waiting" && status.invitations.every((item) => item.covered) ? t.bodies.covered : t.bodies[state]}</p>
          {steps}
          {guide && <div className="mt-6">{guide}</div>}
        </div>
        <div className="border-t border-line p-5 md:p-8">
          {island("panel")}
          {state === "start" && (
            <div className="mt-6 border-l-2 border-warm pl-4">
              <p className="text-base font-medium">{t.giftTitle(price)}</p>
              <p className="mt-1 text-sm text-mist">{t.giftBody}</p>
            </div>
          )}
          <p className="mt-6 text-xs text-mist">{pairingMessages[locale].feeRule}</p>
        </div>
      </section>
    </PairingTracker>
  );
}
