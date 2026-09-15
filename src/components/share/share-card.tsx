import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import styles from "./share-motion.module.css";
import { ShareReveal } from "@/components/share/share-reveal";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicShareSnapshot } from "@/lib/share-types";

/** Pure display: only the deliberately public snapshot crosses this component boundary. */
export function ShareCard({ snapshot, className = "", draft = false }: { snapshot: PublicShareSnapshot; className?: string; draft?: boolean }) {
  const t = shareMessages[snapshot.locale];
  return <article data-share-card className={`rounded-[4px] border border-line bg-paper p-6 text-ink ${className}`}>
    <BrandLogo locale={snapshot.locale} width={brandLogoWidth(snapshot.locale, 168)} />
    <ShareReveal mode={draft ? "static" : "card"}>
      <h2 data-share-reveal className="mt-8 text-[25px] leading-[1.3] tracking-[-.03em]">{t.title}</h2>
      <p className="mt-3 text-sm leading-[1.8]">{t.subtitle}</p>
      <ol className="mt-6 divide-y divide-line">
        {snapshot.lines.map((line, index) => <li key={index} data-share-reveal className="flex gap-4 py-5">
          <span aria-hidden="true" className="pt-1 text-[10px] tracking-[.14em] text-[#c49473]">{String(index + 1).padStart(2, "0")}</span>
          <p className="min-w-0 text-[17px] leading-[1.8]"><span key={line} className={draft ? styles.changed : undefined}>{line}</span></p>
        </li>)}
      </ol>
    </ShareReveal>
    {snapshot.typeLabel && <div className="mt-5 border-t border-line pt-5"><p className="text-xs">{t.referenceType} · {snapshot.typeLabel}</p>{snapshot.typeNote && <p className="mt-2 text-[11px] leading-[1.8]">{snapshot.typeNote}</p>}</div>}
    {snapshot.dimensions && <ul className="mt-4 flex flex-wrap gap-2">{snapshot.dimensions.map(dimension => <li key={dimension.dimension} className="rounded-full border border-line px-3 py-1.5 text-[10px] leading-[1.7]">{dimension.label}</li>)}</ul>}
    <p className="mt-6 border-t border-line pt-5 text-xs leading-[1.8]">{snapshot.disclaimer}</p>
  </article>;
}
