import { AppHeader } from "@/components/site/app-header";

export default function MyReportLoading() {
  return (
    <>
      <AppHeader variant="page" title="我的报告" backHref="/" />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 md:pt-[60px]" aria-busy>
        <div className="h-[44px] w-[260px] animate-pulse rounded bg-[#dfe6e8]" />
      </main>
    </>
  );
}
