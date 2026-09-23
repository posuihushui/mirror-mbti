import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { TrackView } from "@/components/analytics/track-view";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { trackAttrs } from "@/lib/analytics/events";
import { siteMessages } from "@/lib/i18n/messages/site";
import { siteCopy } from "@/lib/site";
import "./globals.css";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

const manrope = localFont({
  src: "../fonts/manrope-latin-wght.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

const copy = siteMessages.en.notFound;
export const metadata: Metadata = { title: `${copy.title} · ${siteCopy("en").name}`, robots: { index: false, follow: false } };

/**
 * 404 for URLs that match no route. Pages live under `app/[lang]`, so there is no single root
 * layout to compose this from; `[lang]/not-found.tsx` still handles `notFound()` inside a page.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-dvh bg-paper text-ink">
        <header className="flex h-[75px] items-center px-[23px] md:mx-auto md:h-[92px] md:max-w-[1320px] md:border-b md:border-line md:px-11">
          <Link href="/" aria-label="mirror home" className="flex min-h-11 items-center">
            <BrandLogo locale="en" tagline={false} width={brandLogoWidth("en", 168, false)} className="md:hidden" />
            <BrandLogo locale="en" className="hidden h-auto md:block md:w-[232px]" />
          </Link>
        </header>
        <main className="mx-auto max-w-[480px] px-[27px] pt-6 pb-[120px] md:pt-[60px]">
          <p className="eyebrow text-mist">404</p>
          <h1 className="mt-4 text-3xl leading-heading md:text-4xl">{copy.heading}</h1>
          <p className="mt-5 text-sm text-mist">{copy.body}</p>
          <Link href="/" className="pill mt-8 max-w-xs" {...trackAttrs("home", "page_cta")}>
            {copy.home}
            <ArrowRight size={19} weight="light" aria-hidden />
          </Link>
        </main>
        <TrackView event="page_not_found" />
      </body>
    </html>
  );
}
