import type { ReactNode } from "react";
import { Info } from "@phosphor-icons/react/dist/ssr";

/**
 * An ⓘ that opens a short explanation over the page, for the caveats a page must keep but need not
 * print in its flow. Place it beside a heading, never inside one: the popover is a block, and its text
 * would join the heading's name. It uses the native popover: no script, the text stays in the server
 * HTML, a tap outside or Escape closes it, and a browser without popover support shows the text in place.
 */
export function InfoTip({ id, label, close, children }: { id: string; label: string; close: string; children: ReactNode }) {
  return (
    <>
      <button type="button" popoverTarget={id} aria-label={label} className="-m-3.5 inline-flex size-11 shrink-0 items-center justify-center text-mist transition-colors hover:text-ink">
        <Info size={16} aria-hidden />
      </button>
      <div id={id} popover="auto" role="note" aria-label={label} className="m-auto w-[min(360px,calc(100vw-32px))] border border-line bg-card p-5 text-ink shadow-[0_18px_48px_rgb(23_27_28/0.16)] backdrop:bg-ink/20">
        <p className="text-base font-medium">{label}</p>
        <div className="mt-3 space-y-2 text-sm text-slate">{children}</div>
        <button type="button" popoverTarget={id} popoverTargetAction="hide" className="mt-3 min-h-11 text-sm font-medium">{close}</button>
      </div>
    </>
  );
}
