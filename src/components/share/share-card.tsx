import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { MirrorMark } from "@/components/brand/mirror-mark";
import { shareMirrorProfile } from "@/lib/share-mark";
import styles from "./share-motion.module.css";
import { ShareReveal } from "@/components/share/share-reveal";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicShareSnapshot } from "@/lib/share-types";

/** Pure display: only the deliberately public snapshot crosses this component boundary. */
export function ShareCard({ snapshot, className = "", draft = false }: { snapshot: PublicShareSnapshot; className?: string; draft?: boolean }) {
  const t = shareMessages[snapshot.locale];
  const mark = shareMirrorProfile(snapshot);
  return <article data-share-card className={`overflow-hidden rounded-[4px] border border-line bg-card text-ink ${className}`}>
    <header className="bg-night p-6 text-paper md:p-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <BrandLogo locale={snapshot.locale} tone="paper" width={brandLogoWidth(snapshot.locale, 168)} />
          {mark && <MirrorMark profile={mark} tone="paper" size={64} className="-mt-2 shrink-0" />}
        </div>
        <ShareReveal mode={draft ? "static" : "card"}>
          <p className="eyebrow mt-10 text-warm">{t.title}</p>
          <div className="mt-4 flex items-start gap-4">
            <span className="pt-2 text-xs tracking-widest text-warm">01</span>
            <h2 data-share-reveal className="min-w-0 text-3xl leading-heading md:text-4xl"><span key={snapshot.lines[0]} className={draft ? styles.changed : undefined}>{snapshot.lines[0]}</span></h2>
          </div>
          <p className="mt-4 text-sm text-night-body">{t.subtitle}</p>
        </ShareReveal>
      </div>
    </header>
    <div className="p-6 md:p-8">
      <ShareReveal mode={draft ? "static" : "card"}>
      <ol className="divide-y divide-line">
        {snapshot.lines.slice(1).map((line, index) => <li key={index} data-share-reveal className="flex gap-4 py-5">
          <span aria-hidden="true" className="pt-1 text-xs tracking-widest text-warm-ink">{String(index + 2).padStart(2, "0")}</span>
          <p className="min-w-0 text-lg"><span key={line} className={draft ? styles.changed : undefined}>{line}</span></p>
        </li>)}
      </ol>
      </ShareReveal>
      {snapshot.typeLabel && <div className="mt-5 border-t border-line pt-5"><p className="text-sm">{t.referenceType} · {snapshot.typeLabel}</p>{snapshot.typeNote && <p className="mt-2 text-xs text-mist">{snapshot.typeNote}</p>}</div>}
      {snapshot.dimensions && <ul className="mt-4 flex flex-wrap gap-2">{snapshot.dimensions.map(dimension => <li key={dimension.dimension} className="rounded-full border border-line px-3 py-1.5 text-xs">{dimension.label}</li>)}</ul>}
    </div>
    <p className="warm-panel p-6 text-xs md:px-8">{snapshot.disclaimer}</p>
  </article>;
}
