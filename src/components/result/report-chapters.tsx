import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { TextLink } from "@/components/site/text-link";
import { trackAttrs, type CtaId } from "@/lib/analytics/events";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import type { ChapterOutline } from "@/lib/report-content";

/** What a locked chapter offers: open the payment sheet, accept a covered invitation, or take the test. */
export type ChapterAction = { href: string; label: string; cta: CtaId; replace?: boolean };

type Props = {
  outline: ChapterOutline[];
  /** The owner's unlocked report (`/report/[id]`, localized): chapters open and link into it. */
  readHref?: string;
  /** Locked chapters only. A result being reconciled has none; its access actions sit above. */
  action?: ChapterAction;
};

/**
 * The report's four chapters on a real result, 16personalities-style: each opens with its first
 * passage, and on a locked result everything after it is masked. What sits under a mask is filler
 * made from its own title: `reportOutline` hands this component titles and cut openings only, so the
 * page's HTML never carries the reading a buyer pays for.
 */
export async function ReportChapters({ outline, readHref, action }: Props) {
  const locale = await getLocale();
  const t = resultMessages[locale].chapters;
  const locked = !readHref;
  return (
    <section id="report" aria-labelledby="report-chapters-heading" className="mx-6 mb-10 border-t border-line pt-8 md:mx-0 md:mb-12 md:pt-10">
      <p className="eyebrow text-warm-ink">{t.eyebrow}</p>
      <h2 id="report-chapters-heading" className="mt-3 text-2xl">{t.heading}</h2>
      <p className="mt-3 max-w-2xl text-sm text-mist">{locked ? t.lockedSub : t.openSub}</p>
      <ol className="mt-6 space-y-4">
        {outline.map((chapter, i) => (
          <li
            key={chapter.label}
            id={`chapter-${i + 1}`}
            data-report-chapter={locked ? "locked" : "open"}
            className="scroll-mt-16 bg-card p-5 md:grid md:scroll-mt-20 md:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-8 md:p-7 xl:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)] xl:gap-x-10"
          >
            <h3 className="flex items-baseline justify-between gap-3 text-base font-medium md:block">
              <span>
                <span aria-hidden className="mr-2 text-xs text-warm-ink md:mr-0 md:mb-2 md:block">0{i + 1}</span>
                {chapter.label}
              </span>
              {locked && <LockSimple size={16} aria-hidden className="shrink-0 translate-y-0.5 text-mist md:mt-3" />}
            </h3>
            <div className="mt-4 border-t border-line pt-4 md:mt-0 md:border-0 md:pt-0">
              {chapter.first.say && <p className="text-xs text-warm-ink">{t.say}</p>}
              <p className={cn("text-sm font-medium", chapter.first.say && "mt-1")}>{chapter.first.title}</p>
              {chapter.first.say ? (
                <p className="mt-2 rounded-[16px] rounded-bl-[4px] border border-line bg-paper px-4 py-3 text-sm text-ink">
                  <span className={cn("block", locked && "[mask-image:linear-gradient(to_right,#000_50%,transparent)]")}>“{chapter.first.opening}</span>
                </p>
              ) : (
                <p className={cn("mt-1.5 text-sm text-slate", locked && "[mask-image:linear-gradient(to_bottom,#000_45%,transparent_120%)]")}>{chapter.first.opening}</p>
              )}
            </div>
            <div className="mt-5 md:mt-0">
              <ul className="space-y-4">
                {chapter.rest.map((title) => (
                  <li key={title}>
                    <p className="text-sm font-medium">{title}</p>
                    {locked && <Masked text={filler(title, locale)} bubble={chapter.first.say} />}
                  </li>
                ))}
              </ul>
              {chapter.extra && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-mist">
                  {locked && <LockSimple size={12} aria-hidden className="shrink-0" />}
                  {t.extra[chapter.extra.kind](chapter.extra.count)}
                </p>
              )}
              {locked && <p className="sr-only">{t.masked}</p>}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 border-t border-line pt-1 md:col-span-3 md:mt-6">
              {locked ? (
                <>
                  <span aria-hidden className="flex min-h-11 items-center gap-2 text-xs text-mist">
                    <LockSimple size={14} className="shrink-0" />
                    {t.masked}
                  </span>
                  {action && (
                    <TextLink href={action.href} replace={action.replace} scroll={false} prefetch={false} className="font-medium" {...trackAttrs(action.cta, "result_chapter")}>
                      {action.label}
                    </TextLink>
                  )}
                </>
              ) : (
                <TextLink href={i ? `${readHref}?chapter=${i + 1}` : readHref} className="font-medium" {...trackAttrs("read_report", "result_chapter")}>
                  {t.read}
                </TextLink>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Enough of a title, repeated, to fill the two masked lines however short the title is. */
function filler(title: string, locale: string) {
  const en = locale === "en";
  return Array(Math.ceil((en ? 160 : 64) / title.length)).fill(title).join(en ? " " : "");
}

/**
 * A passage under a mask: two blurred lines of filler, set like the text they stand in for (inside a
 * speech bubble for chapter 03's lines to say). Hidden from assistive tech and selection alike.
 */
function Masked({ text, bubble }: { text: string; bubble: boolean }) {
  return (
    <span aria-hidden className={cn("mt-1.5 block select-none", bubble && "mt-2 rounded-[14px] rounded-bl-[4px] border border-line bg-paper px-3.5 py-2.5")}>
      <span className="line-clamp-2 text-sm text-slate blur-[3.5px]">{text}</span>
    </span>
  );
}
