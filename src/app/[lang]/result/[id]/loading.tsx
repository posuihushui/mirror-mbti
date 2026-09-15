import { AppHeader } from "@/components/site/app-header";

export default function ResultLoading() {
  return (
    <>
      <AppHeader variant="page" title="你的性格画像" backHref="/" />
      <main className="mx-auto max-w-[1150px] px-[27px] pt-[17px] md:px-10 md:pt-[58px]" aria-busy>
        <div className="h-[15px] w-[160px] animate-pulse rounded bg-[#dfe6e8]" />
        <div className="mt-6 h-[90px] w-[240px] animate-pulse rounded bg-[#dfe6e8]" />
        <div className="mt-6 h-[44px] w-[300px] animate-pulse rounded bg-[#dfe6e8]" />
        <div className="mt-6 h-[60px] max-w-[410px] animate-pulse rounded bg-[#e5ebec]" />
      </main>
    </>
  );
}
