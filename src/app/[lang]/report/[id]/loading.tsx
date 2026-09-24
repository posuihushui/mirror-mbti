import { AppHeader } from "@/components/site/app-header";
import { RadarFrame, Skeleton } from "@/components/site/skeleton";
import { href } from "@/lib/i18n/locale";
import { pageMessages } from "@/lib/i18n/messages/pages";
import { getLocale } from "@/lib/i18n/server";

/** The report's frame: the sidebar on desktop, the dark tabs on phones, then chapter 01's cover and reading. */
export default async function ReportLoading() {
  const locale = await getLocale();
  return (
    <>
      <AppHeader variant="page" title={pageMessages[locale].report.ownTitle} backHref={href(locale, "/")} />
      <main className="block md:mx-auto md:grid md:max-w-[1100px] md:grid-cols-[200px_minmax(0,720px)] md:items-start md:gap-x-10 md:px-8 md:pt-10 md:pb-20 xl:grid-cols-[220px_minmax(0,720px)] xl:gap-x-16" aria-busy>
        <aside className="hidden md:block md:pt-4">
          <Skeleton className="h-3 w-20" />
          <div className="mt-6 flex items-center justify-between gap-3">
            <Skeleton className="h-14 w-32" />
            <Skeleton className="size-14 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-36" />
          <div className="mt-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex min-h-[52px] items-center border-b border-line pl-4"><Skeleton className="h-3 w-24" /></div>
            ))}
          </div>
        </aside>
        <div className="min-w-0">
          <div className="bg-night px-6 pt-6 md:hidden">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton tone="night" className="size-8 rounded-full" />
              <Skeleton tone="night" className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-4 gap-4 border-b border-night-line pb-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} tone="night" className="h-3" />)}
            </div>
          </div>
          <div className="bg-night px-6 pt-6 pb-9 md:px-10 md:pt-9 md:pb-11 xl:px-12">
            <div className="mb-6 flex justify-between md:mb-8">
              <Skeleton tone="night" className="h-3 w-16" />
              <Skeleton tone="night" className="h-3 w-10" />
            </div>
            <Skeleton tone="night" className="h-8 w-3/4 md:h-10" />
            <Skeleton tone="night" className="mt-5 h-4 w-4/5" />
            <Skeleton tone="night" className="mt-2 h-4 w-3/5" />
          </div>
          <div className="px-6 pt-8 md:px-0 md:pt-10">
            <div className="bg-card p-5 md:p-6"><RadarFrame height={260} /></div>
            <Skeleton className="mt-10 h-5 w-40" />
            <div className="mt-4 border-t border-line">
              {[0, 1].map((i) => (
                <div key={i} className="border-b border-line py-6">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-4 h-1.5 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
