import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { PairingTracker } from "@/components/pairing/pairing-tracker";
import { PrimaryButton } from "@/components/site/primary-button";
import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href, type Locale } from "@/lib/i18n/locale";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";

/** Where this result's guide for two stands (`resultPairingStatus`). */
export type PairingStatus = { open: number; guides: number; guide: string | null };

type Props = {
  locale: Locale;
  resultId: string;
  status: PairingStatus;
  /** `aside`: the desktop sidebar under the chapter list; the others close chapter 03 and chapter 04. */
  variant: "aside" | "relationship" | "closing";
};

/**
 * The paid report's way to its guide for two: invite them, they take the free test, unlock the guide.
 * The steps tick off as this result gets there, and the action follows: invite, then see the
 * invitation's progress, then read the guide. It only links out — inviting, consent and 请 TA all
 * happen on `/my/pairing`, which is where the one-line strip above the report leads as well.
 */
export function ReportInvite({ locale, resultId, status, variant }: Props) {
  const t = pairingUiMessages[locale].reportInvite;
  const center = href(locale, `/my/pairing?result=${encodeURIComponent(resultId)}`);
  const location = variant === "aside" ? "report_aside" : "report_invite";
  // Steps reached: none yet, the invitation is out (waiting for them), or a guide exists.
  const reached = status.guides ? 3 : status.open ? 1 : 0;
  const note = status.guides ? t.ready(status.guides) : status.open ? t.waiting(status.open) : null;
  const action = status.guide
    ? { href: status.guide, label: t.readGuide, cta: "read_guide" as const }
    : status.open ? { href: center, label: t.progress, cta: "my_pairing" as const }
    : { href: center, label: t.invite, cta: "invite_pairing" as const };

  const steps = (
    <ol className={cn(variant === "aside" ? "mt-4 space-y-3" : "mt-6 grid gap-4 md:grid-cols-3 md:gap-6")}>
      {t.steps.map((step, i) => {
        const done = i < reached;
        return (
          <li key={step} className={cn("flex gap-3", variant !== "aside" && "md:flex-col md:gap-2")}>
            <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs", done ? "border-warm bg-warm text-paper" : "border-line bg-paper text-warm-ink")}>
              {done ? <Check size={12} weight="bold" /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{step}{done && <span className="sr-only"> · {t.done}</span>}</span>
              {variant !== "aside" && <span className="mt-0.5 block text-xs text-mist">{t.stepNotes[i]}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "aside") {
    return (
      <PairingTracker resultId={resultId} surface="report">
        <section data-report-invite="aside" aria-label={t.eyebrow} className="mt-10">
          <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
          <p className="mt-2 text-base font-medium">{t.asideHeading}</p>
          {steps}
          {note && <p className="mt-4 text-xs text-slate">{note}</p>}
          <div className="mt-4">
            {/* The sidebar is narrow: only the first step is a button; progress and the guide are links. */}
            {reached ? (
              <TextLink href={action.href} prefetch={false} className="font-medium" {...trackAttrs(action.cta, location)}>{action.label}</TextLink>
            ) : (
              <PrimaryButton href={action.href} prefetch={false} className="min-h-11 px-4 text-sm" {...trackAttrs(action.cta, location)}>{action.label}</PrimaryButton>
            )}
          </div>
        </section>
      </PairingTracker>
    );
  }

  return (
    <PairingTracker resultId={resultId} surface="report">
      <section data-report-invite={variant} aria-labelledby={`report-invite-${variant}`} className="my-10 bg-card p-5 md:p-8">
        <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
        <h2 id={`report-invite-${variant}`} className="mt-3 text-2xl whitespace-pre-line">{t.headings[variant]}</h2>
        <p className="mt-3 max-w-xl text-sm text-slate">{t.body}</p>
        {steps}
        {note && <p className="mt-6 text-sm font-medium">{note}</p>}
        <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:gap-8", note ? "mt-3" : "mt-6")}>
          <PrimaryButton href={action.href} prefetch={false} className="md:w-auto md:min-w-64" {...trackAttrs(action.cta, location)}>{action.label}</PrimaryButton>
          {reached ? (
            <TextLink href={center} prefetch={false} {...trackAttrs("invite_pairing", location)}>{t.another}</TextLink>
          ) : (
            <TextLink href={href(locale, "/pairing")} className="text-mist hover:text-ink" {...trackAttrs("pairing_info", location)}>{pairingUiMessages[locale].learn}</TextLink>
          )}
        </div>
        <p className="mt-5 text-xs text-mist">{pairingMessages[locale].feeRule}</p>
      </section>
    </PairingTracker>
  );
}
