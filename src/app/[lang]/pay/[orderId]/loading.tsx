import { AppHeader } from "@/components/site/app-header";

export default function PayLoading() {
  return (
    <>
      <AppHeader variant="page" title="订单状态" backHref="/" />
      <main className="mx-auto max-w-[480px] px-[27px] pt-6 md:pt-[60px]" aria-busy>
        <div className="h-[15px] w-[80px] animate-pulse rounded bg-[#dfe6e8]" />
        <div className="mt-5 h-[44px] w-[260px] animate-pulse rounded bg-[#dfe6e8]" />
      </main>
    </>
  );
}
