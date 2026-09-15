import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteOverlays } from "@/components/site/site-overlays";
import { priceLabelFor } from "@/lib/env";
import { htmlLang, isPublishedLocale, ogLocale, publishedLocales } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import { organizationId, websiteId } from "@/lib/seo";
import { site, siteCopy } from "@/lib/site";
import "../globals.css";

const manrope = localFont({
  src: "../../fonts/manrope-latin-wght.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const keywords = {
  zh: ["MBTI", "人格测试", "性格测试", "16 型人格", "自我探索", "观己", "mirror"],
  en: ["MBTI-style test", "personality test", "16 personality types", "self-discovery", "mirror"],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = siteCopy(locale);
  return {
    metadataBase: new URL(APP_URL),
    title: { default: copy.title, template: `%s · ${copy.name}` },
    description: copy.description,
    applicationName: copy.name,
    keywords: keywords[locale],
    openGraph: {
      type: "website",
      locale: ogLocale[locale],
      siteName: copy.name,
      title: copy.title,
      description: copy.description,
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
    // Baidu: one responsive URL serves both phone and PC.
    other: { "applicable-device": "pc,mobile" },
  };
}

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId(APP_URL),
  name: site.name,
  alternateName: [site.brandZh, site.brand],
  url: APP_URL,
  logo: `${APP_URL}/assets/brand/icon-512.png`,
  email: site.supportEmail,
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.supportEmail, availableLanguage: ["zh-CN"], url: `${APP_URL}/help` },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId(APP_URL),
  name: site.name,
  alternateName: [site.brandZh, site.brand],
  url: APP_URL,
  inLanguage: publishedLocales.map((locale) => htmlLang[locale]),
  description: site.description,
  publisher: { "@id": organizationId(APP_URL) },
};

export function generateStaticParams() {
  return publishedLocales.map((locale) => ({ lang: locale }));
}

/** Root layout for every page. Chinese reaches it as `zh` through the proxy rewrite, so its URLs stay unprefixed. */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await lang();
  if (!isPublishedLocale(locale)) notFound();
  return (
    <html lang={htmlLang[locale]} className={manrope.variable}>
      <body className="min-h-dvh bg-paper text-ink">
        <LocaleProvider locale={locale}>
          {children}
          <Suspense fallback={null}>
            <SiteOverlays priceLabel={priceLabelFor(locale)} />
          </Suspense>
          <Toaster />
        </LocaleProvider>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </body>
    </html>
  );
}
