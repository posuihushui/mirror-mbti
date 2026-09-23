import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import type { Locale } from "@/lib/i18n/locale";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import { OgRadar } from "@/lib/og/radar";
import { profileMeta } from "@/lib/personality";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const copy = {
  zh: { sample: "示例报告", own: "性格画像", footer: "认识自己是一段持续的旅程。这份画像用于自我探索，不定义你。" },
  en: { sample: "SAMPLE REPORT", own: "PERSONALITY", footer: "Knowing yourself is an ongoing journey. This profile doesn’t define you." },
};

/** Rendered per request: results come from the database and fonts are uncached IO. */
export default async function ResultOgImage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  await connection();
  const { lang, id } = await params;
  const locale: Locale = lang === "en" ? "en" : "zh";
  const en = locale === "en";
  const result = (await getResult(id, null)) ?? (await getResult(SAMPLE_RESULT_ID, null))!;
  const { profile, sample } = result;
  const { name, line, typeLabel } = profileMeta(profile, locale);
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY, padding: "64px 84px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          {/* Satori requires native SVG elements. */}
          {BrandLogo({ width: brandLogoWidth(locale, 240), locale })}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, letterSpacing: 3, color: "#738087" }}>{sample ? copy[locale].sample : copy[locale].own}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 20 }}>
              <span style={{ fontSize: 150, lineHeight: 1, fontWeight: 500, letterSpacing: -4 }}>{typeLabel}</span>
              {!en && <span style={{ fontSize: 24, letterSpacing: 4 }}>{name}</span>}
            </div>
            {/* The English label is four words long, so it sits on its own line under the letters. */}
            {en && <div style={{ marginTop: 14, fontSize: 20, color: "#5c6a70" }}>{name}</div>}
            <div style={{ marginTop: 26, fontSize: en ? 32 : 36, lineHeight: 1.45, fontWeight: 500, display: "flex", flexDirection: "column" }}>
              {line.split("\n").map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 16, color: "#829094" }}>{copy[locale].footer}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <OgRadar profile={profile} size={380} locale={locale} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
