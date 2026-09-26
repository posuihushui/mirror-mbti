import { AppHeader } from "@/components/site/app-header";
import { RadarFrame, Skeleton } from "@/components/site/skeleton";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

/** The result page's frame: version line, the dark type block, the chart card and the section nav. */
export default async function ResultLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].result.ownTitle} backHref={href(locale, "/")} />
      <main className="pb-[110px] md:mx-auto md:max-w-6xl md:px-10 md:pb-0" aria-busy>
        <Skeleton className="mx-6 my-5 h-3 w-52 md:mx-0 md:my-6" />
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="bg-night px-6 py-8 md:p-10">
            <Skeleton tone="night" className="h-3 w-24" />
            <div className="mt-6 flex items-start justify-between gap-4">
              <Skeleton tone="night" className="h-[72px] w-44 md:h-24 md:w-60" />
              <Skeleton tone="night" className="size-22 rounded-full md:size-30" />
            </div>
            <Skeleton tone="night" className="mt-8 h-8 w-4/5" />
            <Skeleton tone="night" className="mt-5 h-4 w-3/5" />
            <Skeleton tone="night" className="mt-2 h-4 w-2/5" />
          </div>
          <div className="bg-card p-6 md:p-8">
            <Skeleton className="h-3 w-28" />
            <div className="mt-6 mb-3"><RadarFrame height={300} /></div>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex h-12 items-center gap-6 border-b border-line px-6 md:mt-6 md:h-14 md:px-0">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-3 w-14 shrink-0" />)}
        </div>
      </main>
    </>
  );
}
