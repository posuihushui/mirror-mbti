import type { MetadataRoute } from "next";
import { href, htmlLang, publishedLocales } from "@/lib/i18n/locale";
import { TYPES } from "@/lib/personality";
import { contentUpdatedAt } from "@/lib/seo";

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const lastModified = new Date(contentUpdatedAt);

type Frequency = MetadataRoute.Sitemap[number]["changeFrequency"];

/** Every public page is listed once per published locale, with hreflang alternates pointing at each other. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [path: string, priority: number, changeFrequency: Frequency][] = [
    ["/", 1, "weekly"],
    ["/quiz", 0.9, "weekly"],
    ["/result/sample", 0.8, "monthly"],
    ["/report/sample", 0.7, "monthly"],
    ["/about", 0.7, "monthly"],
    ["/preferences", 0.7, "monthly"],
    ["/help", 0.6, "monthly"],
    ["/types", 0.8, "monthly"],
    ...TYPES.map((t): [string, number, Frequency] => [`/types/${t}`, 0.7, "monthly"]),
    ["/privacy", 0.2, "yearly"],
    ["/terms", 0.2, "yearly"],
  ];
  const absolute = (locale: (typeof publishedLocales)[number], path: string) => {
    const localized = href(locale, path);
    return localized === "/" ? `${APP_URL}/` : `${APP_URL}${localized}`;
  };
  return pages.flatMap(([path, priority, changeFrequency]) =>
    publishedLocales.map((locale) => ({
      url: absolute(locale, path),
      lastModified,
      changeFrequency,
      priority,
      ...(publishedLocales.length > 1
        ? { alternates: { languages: Object.fromEntries(publishedLocales.map((l) => [htmlLang[l], absolute(l, path)])) } }
        : {}),
    })),
  );
}
