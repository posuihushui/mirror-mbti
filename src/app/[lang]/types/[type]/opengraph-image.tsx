import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import type { Locale } from "@/lib/i18n/locale";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import { isPersonalityType, polesFor, typeMeta, type Letter } from "@/lib/personality";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Rendered per request: font files are uncached IO, which Cache Components will not prerender under `[lang]`. */
export default async function TypeOgImage({ params }: { params: Promise<{ lang: string; type: string }> }) {
  await connection();
  const { lang, type } = await params;
  const locale: Locale = lang === "en" ? "en" : "zh";
  const en = locale === "en";
  const t = isPersonalityType(type) ? type : "INFJ";
  const { name, line, letters } = typeMeta(t, locale);
  const poles = polesFor(locale);
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY, padding: "64px 84px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Satori requires native SVG elements. */}
          {BrandLogo({ width: brandLogoWidth(locale, 240), locale })}
          <div style={{ fontSize: 14, letterSpacing: 3, color: "#738087" }}>{en ? "PERSONALITY TYPE" : "PERSONALITY TYPE · 人格倾向"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
          <div style={{ fontSize: 220, lineHeight: 1, fontWeight: 500, letterSpacing: -14 }}>{t}</div>
          <div style={{ display: "flex", flexDirection: "column", paddingBottom: 26 }}>
            {/* English labels are four words long, so they get a smaller size to fit beside the letters. */}
            <div style={{ fontSize: en ? 19 : 28, letterSpacing: en ? 1 : 4, color: "#5c6a70" }}>{name}</div>
            <div style={{ marginTop: 18, fontSize: en ? 30 : 40, lineHeight: 1.4, fontWeight: 500, letterSpacing: -1, display: "flex", flexDirection: "column" }}>
              {line.split("\n").map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {letters.map((l) => (
            <span key={l} style={{ border: "1px solid #cdd7db", borderRadius: 50, padding: "10px 22px", fontSize: 18, color: "#5c6a70" }}>
              {en ? `${poles[l as Letter].label} ${l}` : `${poles[l as Letter].label}倾向 ${l}`}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
