import type { ReactNode } from "react";
import { BookOpen, ChatsCircle, Compass, LockSimple } from "@phosphor-icons/react/dist/ssr";

const items = [
  { Icon: BookOpen, label: "核心性格与优势盲点" },
  { Icon: ChatsCircle, label: "亲密关系与沟通方式" },
  { Icon: Compass, label: "工作偏好与成长建议" },
];

/** `.unlock-panel`: the black paywall block. `action` is the desktop-only CTA slot. */
export function UnlockPanel({ priceLabel, action, secureNote }: { priceLabel: string; action: ReactNode; secureNote: string }) {
  return (
    <section className="mx-4 block bg-night-deep px-[27px] py-8 text-[#eff3f4] md:mx-0 md:grid md:grid-cols-2 md:gap-[45px] md:p-10 xl:gap-[90px] xl:px-[60px] xl:py-14">
      <div>
        <p className="eyebrow text-[9px] text-[#99a6a9]">THERE IS MORE TO YOU</p>
        <h2 className="mt-[25px] text-[29px] leading-[1.55] md:text-[35px]">{"四个字母，\n只是故事的开始。"}</h2>
        <p className="mt-[27px] text-[11px] text-[#a1afb2] md:text-[12px]">理解自己的优势，也看见那些容易忽略的部分。</p>
      </div>
      <div className="mt-[30px] md:mt-0">
        <ul className="m-0 list-none p-0">
          {items.map(({ Icon, label }) => (
            <li key={label} className="mb-[18px] flex items-center gap-4 text-[11px] text-[#d8e0e2] md:text-[12px]">
              <Icon size={20} weight="light" className="text-[#c6a68c]" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-[30px] mb-5 flex items-center justify-between gap-5">
          <strong className="text-[46px] leading-none font-normal tracking-[-2px]">
            <small className="mr-[3px] text-[22px]">¥</small>
            {priceLabel}
          </strong>
          <span className="text-[10px] leading-[1.9] text-[#9eacb0] whitespace-pre-line">{"一次解锁完整报告\n无订阅 · 无自动续费"}</span>
        </div>
        <div className="hidden md:block">{action}</div>
        <p className="mt-[15px] hidden items-center justify-center gap-[5px] text-[9px] text-[#86999f] md:flex">
          <LockSimple size={12} />
          {secureNote}
        </p>
      </div>
    </section>
  );
}
