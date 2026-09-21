import type { MetadataRoute } from "next";
import { href, htmlLang, type Locale } from "@/lib/i18n/locale";
import { site, siteCopy } from "@/lib/site";

/**
 * One web app manifest per language. An English visitor who installs the site must not get a
 * Chinese name, description or `lang`, so each locale serves its own: Chinese from the root
 * `app/manifest.ts`, every other locale from `app/[lang]/manifest.webmanifest`.
 * `start_url` also scopes the installed app to that language's pages.
 */
export function siteManifest(locale: Locale): MetadataRoute.Manifest {
  const copy = siteCopy(locale);
  return {
    name: copy.name,
    short_name: locale === "zh" ? site.brandZh : site.brand,
    description: copy.description,
    start_url: href(locale, "/"),
    display: "standalone",
    background_color: site.themeColor,
    theme_color: site.themeColor,
    lang: htmlLang[locale],
    icons: [
      { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
