import { AppHeader } from "@/components/site/app-header";

export default function ReportLoading() {
  return (
    <>
      <AppHeader variant="page" title="完整人格报告" backHref="/" />
      <main className="md:mx-auto md:max-w-[1100px] md:px-[30px] md:pt-10" aria-busy>
        <div className="min-h-[70vh] animate-pulse bg-night md:ml-[250px]" />
      </main>
    </>
  );
}
