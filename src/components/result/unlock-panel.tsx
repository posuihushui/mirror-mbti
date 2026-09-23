import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChatsCircle, Compass, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { trackAttrs } from "@/lib/analytics/events";
import { href } from "@/lib/i18n/locale";
import { resultMessages } from "@/lib/i18n/messages/result";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getLocale } from "@/lib/i18n/server";
import { SurfaceMark } from "@/components/brand/surface-mark";

const icons = [ChatsCircle, BookOpen, ChatsCircle, Compass];

/** `.unlock-panel`: the black paywall block. `action` is the desktop-only CTA slot. */
export async function UnlockPanel({ priceLabel, action, secureNote }: { priceLabel: string; action: ReactNode; secureNote: string }) {
  const locale = await getLocale();
  const messages = resultMessages[locale];
  const t = messages.unlock;
  return (
    <section className="surface-texture surface-texture-dark relative mx-4 block overflow-hidden bg-night-deep px-6 py-8 text-[#eff3f4] md:mx-0 md:grid md:grid-cols-2 md:gap-12 md:p-10 xl:gap-20 xl:px-14 xl:py-14">
      <SurfaceMark className="-right-24 -bottom-28 opacity-[0.05]" />
      <div className="surface-content">
        <p className="eyebrow text-[9px] text-[#99a6a9]">{t.eyebrow}</p>
        <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{t.heading}</h2>
        <p className="mt-[27px] text-[11px] text-[#a1afb2] md:text-[12px]">{t.sub}</p>
        <Link href={href(locale, "/report/sample")} className="text-link mt-5 min-h-11 text-[12px] text-[#d8e0e2]" {...trackAttrs("read_sample_report", "unlock_panel")}>{t.sampleLink}</Link>
      </div>
      <div className="surface-content mt-[30px] md:mt-0">
        <ul className="m-0 list-none p-0">
          {t.items.map((label, i) => {
            const Icon = icons[i];
            return (
              <li key={label} className="mb-[18px] flex items-center gap-4 text-[11px] text-[#d8e0e2] md:text-[12px]">
                <Icon size={20} weight="light" className="text-[#c6a68c]" />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-[30px] mb-5 flex items-center justify-between gap-5">
          <strong className="relative text-[46px] leading-none font-normal tracking-[-2px] text-warm">
            <small className="mr-[3px] text-[22px]">{messages.currency}</small>
            {priceLabel}
          </strong>
          <span className="text-[10px] leading-[1.9] text-[#9eacb0] whitespace-pre-line">{t.priceNote}</span>
        </div>
        <p className="mb-5 text-xs leading-[1.9] text-[#d8e0e2]">{pairingMessages[locale].feeRule}</p>
        <div className="hidden md:block">{action}</div>
        <p className="mt-4 text-[12px] leading-[1.9] text-[#a1afb2]">{t.after}</p>
        <Link href={href(locale, "/help")} className="text-link mt-3 min-h-11 text-[12px] text-[#d8e0e2]" {...trackAttrs("view_help", "unlock_panel")}>{t.help}</Link>
        <p className="mt-[15px] hidden items-center justify-center gap-[5px] text-[9px] text-[#86999f] md:flex">
          <LockSimple size={12} />
          {secureNote}
        </p>
      </div>
    </section>
  );
}
