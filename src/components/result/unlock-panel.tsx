import type { ReactNode } from "react";
import { BookOpen, ChatsCircle, Compass, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { TextLink } from "@/components/site/text-link";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getLocale } from "@/lib/i18n/server";
import { unlockBulletsFor } from "@/lib/site";

const icons = [BookOpen, Compass, ChatsCircle];

type Props = {
  priceLabel: string;
  secureNote: string;
  /** How each chapter opens, already cut to a teaser on the server. */
  preview: { label: string; opening: string }[];
  /** The desktop CTA; phones use the fixed dock. */
  action: ReactNode;
};

/**
 * `.unlock-panel`: the page's one conversion moment. It shows what the report actually says —
 * each chapter's first lines, fading out — rather than a list of promises.
 */
export async function UnlockPanel({ priceLabel, action, secureNote, preview }: Props) {
  const locale = await getLocale();
  const messages = resultMessages[locale];
  const t = messages.unlock;
  return (
    <section aria-labelledby="unlock-heading" className="mx-4 bg-night-deep px-6 py-8 text-paper md:mx-0 md:grid md:grid-cols-[1.15fr_1fr] md:gap-12 md:p-10 xl:gap-20 xl:p-14">
      <div>
        <p className="eyebrow text-night-mist">{t.eyebrow}</p>
        <h2 id="unlock-heading" className="mt-5 text-3xl leading-heading md:text-4xl">{t.heading}</h2>
        <p className="mt-4 text-sm text-night-body">{t.sub}</p>
        <ol aria-label={t.previewLabel} className="mt-6 border-t border-night-line">
          {preview.map(({ label, opening }, i) => (
            <li key={label} className="border-b border-night-line py-4">
              <p className="flex items-baseline gap-3 text-sm">
                <span aria-hidden className="text-xs text-warm">0{i + 1}</span>
                <span className="font-medium">{label}</span>
              </p>
              <p className="mt-1 line-clamp-2 pl-7 text-sm text-night-body [mask-image:linear-gradient(to_bottom,#000_40%,transparent_115%)]">{opening}</p>
            </li>
          ))}
        </ol>
        <TextLink href={href(locale, "/report/sample")} className="mt-3 text-night-body hover:text-paper" {...trackAttrs("read_sample_report", "unlock_panel")}>{t.sampleLink}</TextLink>
      </div>
      <div className="mt-8 md:mt-0">
        <div className="flex items-end justify-between gap-5">
          <strong className="text-5xl leading-none font-normal tracking-tight text-warm">
            <small className="mr-1 text-2xl">{messages.currency}</small>
            {priceLabel}
          </strong>
          <span className="pb-1 text-xs text-night-mist">{t.priceNote}</span>
        </div>
        <ul className="mt-6 space-y-3">
          {unlockBulletsFor(locale).map((label, i) => {
            const Icon = icons[i];
            return (
              <li key={label} className="flex items-center gap-3 text-sm text-night-body">
                <Icon size={20} weight="light" className="shrink-0 text-warm" />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs text-night-mist">{pairingMessages[locale].feeRule}</p>
        <div className="mt-6 hidden md:block">{action}</div>
        <p className="mt-4 hidden items-center gap-1.5 text-xs text-night-mist md:flex">
          <LockSimple size={13} aria-hidden />
          {secureNote}
        </p>
        <p className="mt-5 text-xs text-night-mist">{t.after}</p>
        <TextLink href={href(locale, "/help")} className="mt-1 text-night-body hover:text-paper" {...trackAttrs("view_help", "unlock_panel")}>{t.help}</TextLink>
      </div>
    </section>
  );
}

/** Desktop only: the report offer directly under the result, so the first screen has a next step. */
export async function UnlockBar({ priceLabel, action }: { priceLabel: string; action: ReactNode }) {
  const locale = await getLocale();
  const messages = resultMessages[locale];
  const t = messages.unlockBar;
  return (
    <section className="mb-12 hidden items-center justify-between gap-8 border border-line bg-card px-8 py-5 md:flex">
      <div className="min-w-0">
        <p className="text-base font-medium">{t.title}</p>
        <p className="mt-1 text-sm text-mist">{t.sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-6">
        <strong className="text-3xl font-normal tracking-tight">
          <small className="mr-0.5 text-base">{messages.currency}</small>
          {priceLabel}
        </strong>
        <div className="w-60">{action}</div>
      </div>
    </section>
  );
}
