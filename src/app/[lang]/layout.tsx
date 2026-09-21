import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { Toaster } from "@/components/ui/sonner";
import { PageViews } from "@/components/analytics/page-views";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteOverlays } from "@/components/site/site-overlays";
import { defaultLocale, href, htmlLang, isPublishedLocale, type Locale, ogLocale, publishedLocales } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import { absoluteUrl, organizationId, websiteId } from "@/lib/seo";
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
    // Overrides the root `manifest.ts` link, which is Chinese; each locale installs as its own app.
    manifest: href(locale, "/manifest.webmanifest"),
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

/**
 * Site-wide structured data, in the language of the page carrying it: an English page that named the
 * site 观己 mirror and described it in Chinese would tell crawlers `/en` is a Chinese site.
 * Support is offered in both languages, so `availableLanguage` lists both and the contact link
 * points at this locale's help page.
 */
function organizationJsonLd(locale: Locale) {
  const copy = siteCopy(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(APP_URL),
    name: copy.name,
    // One entity, one homepage: only the name and the support link follow the page's language.
    ...(locale === defaultLocale ? { alternateName: [site.brandZh, site.brand] } : {}),
    url: APP_URL,
    logo: `${APP_URL}/assets/brand/icon-512.png`,
    email: site.supportEmail,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.supportEmail,
      availableLanguage: publishedLocales.map((published) => htmlLang[published]),
      url: absoluteUrl(APP_URL, locale, "/help"),
    },
  };
}

/** One `WebSite` per language version, each with its own id, home URL and single `inLanguage`. */
function websiteJsonLd(locale: Locale) {
  const copy = siteCopy(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(APP_URL, locale),
    name: copy.name,
    ...(locale === defaultLocale ? { alternateName: [site.brandZh, site.brand] } : {}),
    url: absoluteUrl(APP_URL, locale, "/"),
    inLanguage: htmlLang[locale],
    description: copy.description,
    publisher: { "@id": organizationId(APP_URL) },
  };
}

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
            <PageViews />
            <SiteOverlays />
          </Suspense>
          <Toaster />
        </LocaleProvider>
        <JsonLd data={[organizationJsonLd(locale), websiteJsonLd(locale)]} />
      </body>
    </html>
  );
}
