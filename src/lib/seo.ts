import type { Metadata } from "next";
import { defaultLocale, href, ogLocale, publishedLocales, type Locale } from "@/lib/i18n/locale";
import { siteCopy } from "@/lib/site";

/** Last substantive update of the public, indexable copy. Bump it with content changes so the sitemap and structured data stay honest. */
export const contentUpdatedAt = "2026-09-19";

type PageSeo = {
  /** Defaults to Chinese, whose URLs are unprefixed. */
  locale?: Locale;
  title: string;
  description: string;
  /** Unprefixed page path, e.g. `/types`; the locale prefix is added here. */
  path: string;
  absoluteTitle?: boolean;
  shareTitle?: string;
  shareDescription?: string;
  /** Unprefixed path of the page's share image when its segment ships its own `opengraph-image`. */
  image?: string;
};

/**
 * Metadata for an indexable page. Next merges `openGraph` and `twitter` shallowly,
 * so a page that sets only an OG title would silently drop the layout's siteName,
 * locale, type and url — always build them together here.
 */
export function pageMetadata({ locale = defaultLocale, title, description, path, absoluteTitle, shareTitle, shareDescription, image }: PageSeo): Metadata {
  const copy = siteCopy(locale);
  const url = href(locale, path);
  const ogTitle = shareTitle ?? (absoluteTitle ? title : `${title} · ${copy.name}`);
  const ogDescription = shareDescription ?? description;
  // Always name the share image explicitly. Setting `openGraph` drops the inherited root image, and a
  // segment's own image file would resolve under the internal `/zh` rewrite path, so build the public
  // URL here instead; explicit images take precedence over file-based ones.
  const images = { images: [{ url: href(locale, image ?? "/opengraph-image"), width: 1200, height: 630, alt: `${copy.name} — ${copy.tagline}` }] };
  // Every public page exists in each published locale, so hreflang pairs are symmetric.
  const languages = publishedLocales.length > 1 ? { languages: { "zh-CN": href("zh", path), en: href("en", path), "x-default": href("zh", path) } } : {};
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, ...languages },
    openGraph: { type: "website", locale: ogLocale[locale], siteName: copy.name, url, title: ogTitle, description: ogDescription, ...images },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, ...images },
  };
}

/** Absolute URL of a page in a locale. The Chinese home stays bare, as every JSON-LD node writes it. */
export function absoluteUrl(baseUrl: string, locale: Locale, path: string) {
  const localized = href(locale, path);
  return localized === "/" ? baseUrl : `${baseUrl}${localized}`;
}

/** One organization publishes both language versions, so its node keeps a single id. */
export const organizationId = (baseUrl: string) => `${baseUrl}/#organization`;
/** Each language version is its own `WebSite`: one id per locale, or the two would overwrite each other. */
export const websiteId = (baseUrl: string, locale: Locale = defaultLocale) =>
  locale === defaultLocale ? `${baseUrl}/#website` : `${baseUrl}/#website-${locale}`;

export function breadcrumbJsonLd(baseUrl: string, items: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: path === "/" ? baseUrl : `${baseUrl}${path}`,
    })),
  };
}
