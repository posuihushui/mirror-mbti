/* eslint-disable @next/next/no-img-element -- Satori renders a static PNG, not a browser image. */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { MirrorMark } from "@/components/brand/mirror-mark";
import type { Locale } from "@/lib/i18n/locale";
import { reportMessages } from "@/lib/i18n/messages/report";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import { polesFor, profileMeta, type Letter, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";

/**
 * The owner's report summary as a 960×1280 PNG: type, name and line, the four dimensions with their
 * clarity, and this week's small step. The QR carries the public quiz URL, never the private report.
 * The sample's image says it is a sample. One explicit flex column holds the three regions, as Satori needs.
 */
export async function renderReportImage(profile: Profile, locale: Locale, quizUrl: string, sample = false) {
  const en = locale === "en";
  const t = reportMessages[locale];
  const poles = polesFor(locale);
  const { name, line } = profileMeta(profile, locale);
  const [fonts, qr] = await Promise.all([ogFonts(), QRCode.toDataURL(quizUrl, { width: 150, margin: 3, errorCorrectionLevel: "M", color: { dark: "#171b1c", light: "#c49473" } })]);
  const rows = profile.type.split("").map((letter, i) => {
    const reading = dimensionReading(profile, i, locale);
    return { key: letter + i, label: `${poles[letter as Letter].label} ${letter}`, value: profile.values[i], degree: reading.degree, balanced: profile.balanced[i] };
  });
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
      <div style={{ display: "flex", flexDirection: "column", height: 560, flexShrink: 0, padding: "56px 64px", background: "#121718", color: "#edf2f3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", height: 44 }}>{BrandLogo({ locale, tone: "paper", width: brandLogoWidth(locale, 194) })}</div>
          <div style={{ display: "flex" }}>{MirrorMark({ profile, tone: "paper", size: 140 })}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ fontSize: 19, letterSpacing: 2, color: "#c49473" }}>{sample ? t.image.sampleEyebrow : t.image.eyebrow}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 14 }}>
            <div style={{ fontSize: 120, fontWeight: 500, lineHeight: 1, letterSpacing: -4 }}>{profile.type}</div>
            {!en && <div style={{ fontSize: 30, color: "#b4c1c5" }}>{name}</div>}
          </div>
          <div style={{ marginTop: 26, fontSize: en ? 36 : 42, lineHeight: 1.35, fontWeight: 500, whiteSpace: "pre-line" }}>{line}</div>
        </div>
      </div>
      {/* The four rows share the band between the cover and the footer evenly. */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "48px 64px 44px", justifyContent: "space-between" }}>
        {rows.map((row) => (
          <div key={row.key} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 27 }}>
              <div style={{ display: "flex", fontWeight: 500 }}>{row.label}</div>
              <div style={{ display: "flex", gap: 14, color: row.balanced ? "#8f6242" : "#5d696d" }}><div>{`${row.value}%`}</div><div>{row.degree}</div></div>
            </div>
            <div style={{ display: "flex", height: 8, background: "#d2dcdf", borderRadius: 4 }}>
              <div style={{ display: "flex", width: `${row.value}%`, height: 8, background: "#c49473", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", height: 270, flexShrink: 0, padding: "36px 64px", justifyContent: "space-between", alignItems: "center", gap: 40, background: "#c49473" }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 18, letterSpacing: 2, opacity: 0.75 }}>{t.four.stepEyebrow}</div>
          <div style={{ fontSize: en ? 26 : 30, lineHeight: 1.45, fontWeight: 500, whiteSpace: "pre-line" }}>{t.four.stepHeading}</div>
          <div style={{ marginTop: 6, fontSize: 18, opacity: 0.8 }}>{t.image.note}</div>
        </div>
        {/* What the code does is said under it, so nobody scans a stranger's image expecting their report. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 240 }}>
          <img src={qr} alt="" width={150} height={150} />
          <div style={{ fontSize: 15, lineHeight: 1.4, textAlign: "center", opacity: 0.85 }}>{t.image.scan}</div>
        </div>
      </div>
    </div>,
    { width: 960, height: 1280, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
