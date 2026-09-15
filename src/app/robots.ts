import type { MetadataRoute } from "next";

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    // `*` deliberately covers search and AI answer crawlers (Baiduspider, Bytespider, GPTBot,
    // OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended…) so they can cite public pages.
    // A bot-specific group replaces `*` for that bot, so it must repeat these disallows.
    rules: [
      {
        userAgent: "*",
        // Private routes exist under every locale prefix; keep both lists in step with `publishedLocales`.
        allow: ["/", "/result/sample", "/report/sample", "/en/result/sample", "/en/report/sample"],
        disallow: [...["", "/en", "/zh"].flatMap(prefix => ["/s/", "/t/", "/compare/"].map(path => prefix + path)), "/api/", "/report/", "/pay/", "/my/", "/result/", "/en/report/", "/en/pay/", "/en/my/", "/en/result/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
