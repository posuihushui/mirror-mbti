import { ImageResponse } from "next/og";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import type { Locale } from "@/lib/i18n/locale";
import { OG_FONT_FAMILY, ogFonts, portraitDataUrl } from "@/lib/og/fonts";

/** Home share card, shared by `/opengraph-image` (English) and `/zh/opengraph-image`. */
const copy = {
  zh: {
    eyebrow: "MBTI 测试体验 · 16 型人格探索",
    title: ["向内看见，", "真实的自己。"],
    titleSize: 68,
    question: "你如何感受世界、与人相处、做出选择？",
    stats: [["32/64", "题可选"], ["5–10", "分钟左右"], ["16", "种人格倾向"]],
  },
  en: {
    // No ® here: the OG Latin subset is not guaranteed to carry it.
    eyebrow: "MBTI-STYLE TEST · 16 PERSONALITY TYPES",
    title: ["Look within,", "see your true self."],
    titleSize: 56,
    question: "How do you sense the world, relate to people and make choices?",
    stats: [["32/64", "items"], ["5–10", "minutes"], ["16", "types"]],
  },
};

export async function homeOgImage(locale: Locale) {
  const t = copy[locale];
  const [fonts, portrait] = await Promise.all([ogFonts(), portraitDataUrl(locale)]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 0 72px 84px", width: 660 }}>
          {/* Satori requires native SVG elements. */}
          {BrandLogo({ width: brandLogoWidth(locale, 280), locale })}
          <div style={{ marginTop: 56, fontSize: 14, letterSpacing: 2, color: "#627176" }}>{t.eyebrow}</div>
          <div style={{ marginTop: 22, fontSize: t.titleSize, lineHeight: 1.25, letterSpacing: -3, fontWeight: 500, display: "flex", flexDirection: "column" }}>
            {t.title.map((part) => (
              <span key={part}>{part}</span>
            ))}
          </div>
          <div style={{ marginTop: 28, fontSize: 20, lineHeight: 1.7, color: "#677276" }}>{t.question}</div>
          <div style={{ marginTop: 34, display: "flex", gap: 28, fontSize: 24, fontWeight: 500 }}>
            {t.stats.map(([value, label], i) => (
              <span key={label} style={{ display: "flex", alignItems: "baseline", gap: 8, ...(i > 0 ? { borderLeft: "1px solid #d2dcdf", paddingLeft: 28 } : {}) }}>
                {value} <span style={{ fontSize: 14, color: "#798286", fontWeight: 400 }}>{label}</span>
              </span>
            ))}
          </div>
        </div>
        {portrait && (
          <div style={{ display: "flex", width: 540, height: "100%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img> only */}
            <img src={portrait} alt="" width={540} height={630} style={{ objectFit: "cover", objectPosition: "50% 30%" }} />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
