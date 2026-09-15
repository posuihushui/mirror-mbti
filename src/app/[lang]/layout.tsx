import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteOverlays } from "@/components/site/site-overlays";
import { priceFen } from "@/lib/env";
import { formatPriceFen, site } from "@/lib/site";
import "./globals.css";

const manrope = localFont({
  src: "../fonts/manrope-latin-wght.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["MBTI", "人格测试", "性格测试", "16 型人格", "自我探索", "观己", "mirror"],
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: APP_URL,
  logo: `${APP_URL}/assets/brand/icon-512.png`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  alternateName: [site.brandZh, site.brand],
  url: APP_URL,
  inLanguage: "zh-CN",
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={manrope.variable}>
      <body className="min-h-dvh bg-paper text-ink">
        {children}
        <Suspense fallback={null}>
          <SiteOverlays priceLabel={formatPriceFen(priceFen())} />
        </Suspense>
        <Toaster />
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </body>
    </html>
  );
}
