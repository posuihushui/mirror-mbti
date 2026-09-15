import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { TrackView } from "@/components/analytics/track-view";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { trackAttrs } from "@/lib/analytics/events";
import { site } from "@/lib/site";
import "./globals.css";

const manrope = localFont({
  src: "../fonts/manrope-latin-wght.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = { title: `页面不存在 · ${site.name}`, robots: { index: false, follow: false } };

/**
 * 404 for URLs that match no route. Pages live under `app/[lang]`, so there is no single root
 * layout to compose this from; `[lang]/not-found.tsx` still handles `notFound()` inside a page.
 */
export default function GlobalNotFound() {
  return (
    <html lang="zh-CN" className={manrope.variable}>
      <body className="min-h-dvh bg-paper text-ink">
        <header className="flex h-[75px] items-center px-[23px] md:mx-auto md:h-[92px] md:max-w-[1320px] md:border-b md:border-line md:px-11">
          <Link href="/" aria-label="观己 mirror 首页" className="flex min-h-11 items-center">
            <BrandLogo tagline={false} width={brandLogoWidth("zh", 168, false)} className="md:hidden" />
            <BrandLogo className="hidden h-auto md:block md:w-[194px]" />
          </Link>
        </header>
        <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-[120px] md:pt-[60px]">
          <p className="eyebrow text-[#738087]">404</p>
          <h1 className="mt-[18px] text-[27px] leading-[1.6] tracking-[-0.035em] md:text-[32px]">{"这一页还没有故事。\n回到开始的地方。"}</h1>
          <p className="mt-[23px] text-[13px] leading-[1.9] text-[#6b777d]">链接可能已过期，或者结果属于另一位访客。你可以回到首页重新开始。</p>
          <p lang="en" className="mt-3 text-[12px] leading-[1.9] text-[#7f8e94]">This page doesn’t exist. The link may have expired.</p>
          <Link href="/" className="pill mt-8 max-w-[246px]" {...trackAttrs("home", "page_cta")}>
            回到首页
          </Link>
        </main>
        <TrackView event="page_not_found" />
      </body>
    </html>
  );
}
