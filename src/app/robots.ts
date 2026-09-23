import type { MetadataRoute } from "next";
import { href, publishedLocales } from "@/lib/i18n/locale";

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    // `*` deliberately covers search and AI answer crawlers (Baiduspider, Bytespider, GPTBot,
    // OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended…) so they can cite public pages.
    // A bot-specific group replaces `*` for that bot, so it must repeat these disallows.
    rules: [
      {
        userAgent: "*",
        // Private routes exist in both languages; derive their paths from the published locales.
        allow: publishedLocales.flatMap(locale => [href(locale, "/"), href(locale, "/result/sample"), href(locale, "/report/sample")]),
        disallow: ["/api/", ...publishedLocales.flatMap(locale => ["/s/", "/t/", "/compare/", "/report/", "/pay/", "/my/", "/result/"].map(path => href(locale, path)))],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
