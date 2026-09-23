/* eslint-disable @next/next/no-img-element -- Satori renders a static PNG, not a browser image. */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { BrandLogo, BrandMark, brandLogoWidth } from "@/components/brand/brand-logo";
import type { CompareContent } from "@/lib/compare-types";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";

/**
 * What a pair may take away from their guide: the emphasis, its quote and the shared practice.
 * Neither person's categories, questionnaire version or test date is rendered, and the QR points
 * at the public feature page — never at the private guide, whose URL is not transferable anyway.
 */
function takeaway(content: CompareContent, locale: Locale) {
  const m = compareMessages[locale];
  if (content.contentVersion === "compare-v3") {
    return {
      title: content.highlight.dimension ? m.themes[content.highlight.dimension] : m.title,
      body: content.highlight.body,
      quote: content.highlight.openingLine,
      practice: content.practice,
    };
  }
  const closing = content.sections[2];
  return { title: closing.title, body: closing.body, quote: closing.openingLine, practice: closing.practice };
}

export async function renderCompareImage(content: CompareContent, locale: Locale, publicUrl: string) {
  const m = compareMessages[locale];
  const en = locale === "en";
  const { title, body, quote, practice } = takeaway(content, locale);
  const [fonts, qr] = await Promise.all([
    ogFonts(),
    QRCode.toDataURL(publicUrl, { width: 160, margin: 4, errorCorrectionLevel: "M", color: { dark: "#171b1c", light: "#edf2f3" } }),
  ]);
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", width: "100%", height: "100%", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
      <div style={{ display: "flex", position: "relative", overflow: "hidden", flexDirection: "column", height: 590, flexShrink: 0, padding: 64, background: "#121718", color: "#edf2f3" }}>
        <div style={{ display: "flex", position: "absolute", right: -155, bottom: -185, opacity: .1 }}>{BrandMark({ tone: "paper", monochrome: true, size: 560 })}</div>
        <div style={{ display: "flex", height: 44 }}>{BrandLogo({ locale, tone: "paper", width: brandLogoWidth(locale, 194) })}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", width: 760 }}>
          <div style={{ display: "flex", fontSize: 19, letterSpacing: 2, color: "#c49473" }}>{m.highlightLabel}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: en ? 52 : 62, fontWeight: 500, lineHeight: 1.2 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: en ? 25 : 29, lineHeight: 1.65, color: "#cbd6d8" }}>{body}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "42px 64px 32px" }}>
        {quote && <div style={{ display: "flex", flexDirection: "column", paddingLeft: 28, borderLeft: "2px solid #c49473" }}>
          <div style={{ display: "flex", fontSize: 19, color: "#627176" }}>{m.openingLineLabel}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: en ? 34 : 40, lineHeight: 1.55 }}>{quote}</div>
        </div>}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 18, lineHeight: 1.5, color: "#627176" }}>{m.note}</div>
      </div>
      <div style={{ display: "flex", height: 268, flexShrink: 0, padding: "32px 64px", justifyContent: "space-between", gap: 36, alignItems: "center", background: "#c49473" }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 18, opacity: .7 }}>{m.practiceLabel}</div>
          {practice && <div style={{ display: "flex", fontSize: en ? 25 : 28, lineHeight: 1.55 }}>{practice}</div>}
          <div style={{ display: "flex", fontSize: 17 }}>{m.imageScan}</div>
        </div>
        <img src={qr} alt="" width={160} height={160} />
      </div>
    </div>,
    { width: 960, height: 1280, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
