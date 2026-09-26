import type { ReactNode } from "react";
import { BookOpen, ChatsCircle, CheckCircle, Compass, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { PrimaryButton } from "@/components/site/primary-button";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
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
  /** The desktop CTA; phones use the fixed dock. */
  action: ReactNode;
  /**
   * The host of an invitation this reader came from covered their report: the panel offers joining
   * (which opens the report) instead of a price, and keeps buying it oneself as a quiet link.
   */
  covered?: { href: string; buyHref: string };
};

/**
 * `.unlock-panel`: the page's one dark conversion moment. The chapters above it already show how
 * the report opens and what stays masked, so it carries the price, what unlocking brings, and the rules.
 */
export async function UnlockPanel({ priceLabel, action, secureNote, covered }: Props) {
  const locale = await getLocale();
  const messages = resultMessages[locale];
  const t = messages.unlock;
  const g = pairingUiMessages[locale].gift;
  return (
    <section aria-labelledby="unlock-heading" data-gift={covered ? "covered-panel" : undefined} className="mx-4 bg-night-deep px-6 py-8 text-paper md:mx-0 md:grid md:grid-cols-[1.15fr_1fr] md:gap-12 md:p-10 xl:gap-20 xl:p-14">
      <div>
        <p className="eyebrow text-night-mist">{covered ? pairingMessages[locale].title : t.eyebrow}</p>
        <h2 id="unlock-heading" className="mt-5 text-3xl leading-heading md:text-4xl">{covered ? g.resultHeading : t.heading}</h2>
        <p className="mt-4 text-sm text-night-body">{covered ? g.resultBody : t.sub}</p>
        <TextLink href={href(locale, "/report/sample")} className="mt-5 text-night-body hover:text-paper" {...trackAttrs("read_sample_report", "unlock_panel")}>{t.sampleLink}</TextLink>
      </div>
      <div className="mt-8 md:mt-0">
        {covered ? <p className="flex items-center gap-3 text-xl"><CheckCircle size={28} weight="fill" className="shrink-0 text-warm" aria-hidden />{g.dockLabel}</p> : <div className="flex items-end justify-between gap-5">
          <strong className="text-5xl leading-none font-normal tracking-tight text-warm">
            <small className="mr-1 text-2xl">{messages.currency}</small>
            {priceLabel}
          </strong>
          <span className="pb-1 text-xs text-night-mist">{t.priceNote}</span>
        </div>}
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
        {covered ? <>
          <p className="mt-5 text-xs text-night-mist">{g.consent}</p>
          <div className="mt-6 hidden md:block"><PrimaryButton href={covered.href} prefetch={false} light {...trackAttrs("accept_covered", "unlock_panel")}>{g.accept}</PrimaryButton></div>
          <TextLink href={covered.buyHref} prefetch={false} className="mt-3 text-night-body hover:text-paper" {...trackAttrs("buy_own_report", "unlock_panel")}>{`${g.buyOwn} · ${messages.currency}${priceLabel}`}</TextLink>
        </> : <>
          <p className="mt-5 text-xs text-night-mist">{pairingMessages[locale].feeRule}</p>
          <div className="mt-6 hidden md:block">{action}</div>
          <p className="mt-4 hidden items-center gap-1.5 text-xs text-night-mist md:flex">
            <LockSimple size={13} aria-hidden />
            {secureNote}
          </p>
        </>}
        {/* Order numbers and recovery belong to buying; a covered report has no order of its own. */}
        {!covered && <p className="mt-5 text-xs text-night-mist">{t.after}</p>}
        <TextLink href={href(locale, "/help")} className="mt-1 text-night-body hover:text-paper" {...trackAttrs("view_help", "unlock_panel")}>{t.help}</TextLink>
      </div>
    </section>
  );
}
