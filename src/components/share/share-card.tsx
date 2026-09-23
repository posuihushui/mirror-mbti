import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import styles from "./share-motion.module.css";
import { ShareReveal } from "@/components/share/share-reveal";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicShareSnapshot } from "@/lib/share-types";

/** Pure display: only the deliberately public snapshot crosses this component boundary. */
export function ShareCard({ snapshot, className = "", draft = false }: { snapshot: PublicShareSnapshot; className?: string; draft?: boolean }) {
  const t = shareMessages[snapshot.locale];
  return <article data-share-card className={`overflow-hidden rounded-[4px] border border-line bg-card text-ink ${className}`}>
    <header className="surface-texture surface-texture-dark bg-night p-6 text-paper md:p-8">
      <div className="surface-content">
        <BrandLogo locale={snapshot.locale} tone="paper" width={brandLogoWidth(snapshot.locale, 168)} />
        <ShareReveal mode={draft ? "static" : "card"}>
          <p className="eyebrow mt-10 text-warm">{t.title}</p>
          <div className="mt-4 flex items-start gap-4">
            <span className="pt-2 text-[10px] tracking-[.14em] text-warm">01</span>
            <h2 data-share-reveal className="min-w-0 text-3xl leading-normal tracking-[-.03em] md:text-4xl"><span key={snapshot.lines[0]} className={draft ? styles.changed : undefined}>{snapshot.lines[0]}</span></h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#bac6c9]">{t.subtitle}</p>
        </ShareReveal>
      </div>
    </header>
    <div className="p-6 md:p-8">
      <ShareReveal mode={draft ? "static" : "card"}>
      <ol className="mt-6 divide-y divide-line">
        {snapshot.lines.slice(1).map((line, index) => <li key={index} data-share-reveal className="flex gap-4 py-5">
          <span aria-hidden="true" className="pt-1 text-[10px] tracking-[.14em] text-[#8d7259]">{String(index + 2).padStart(2, "0")}</span>
          <p className="min-w-0 text-[17px] leading-[1.8]"><span key={line} className={draft ? styles.changed : undefined}>{line}</span></p>
        </li>)}
      </ol>
      </ShareReveal>
      {snapshot.typeLabel && <div className="mt-5 border-t border-line pt-5"><p className="text-xs">{t.referenceType} · {snapshot.typeLabel}</p>{snapshot.typeNote && <p className="mt-2 text-[11px] leading-[1.8]">{snapshot.typeNote}</p>}</div>}
      {snapshot.dimensions && <ul className="mt-4 flex flex-wrap gap-2">{snapshot.dimensions.map(dimension => <li key={dimension.dimension} className="rounded-full border border-line px-3 py-1.5 text-[10px] leading-[1.7]">{dimension.label}</li>)}</ul>}
    </div>
    <p className="warm-panel p-6 text-xs leading-7 md:px-8">{snapshot.disclaimer}</p>
  </article>;
}
