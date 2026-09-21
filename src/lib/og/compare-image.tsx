/* eslint-disable @next/next/no-img-element -- Satori renders a static PNG, not a browser image. */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
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
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 64, background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
      <div style={{ display: "flex", height: 44, flexShrink: 0 }}>{BrandLogo({ locale, width: brandLogoWidth(locale, 194) })}</div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 34, justifyContent: "center" }}>
        <div style={{ display: "flex", fontSize: 19, letterSpacing: 2, color: "#8d7259" }}>{m.highlightLabel}</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: en ? 50 : 58, fontWeight: 500, lineHeight: 1.25 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: en ? 26 : 30, lineHeight: 1.7, color: "#3d4a4e" }}>{body}</div>
        {quote && <div style={{ display: "flex", flexDirection: "column", marginTop: 48, paddingLeft: 28, borderLeft: "2px solid #c49473" }}>
          <div style={{ display: "flex", fontSize: 19, color: "#627176" }}>{m.openingLineLabel}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: en ? 34 : 40, lineHeight: 1.6 }}>{quote}</div>
        </div>}
        {practice && <div style={{ display: "flex", flexDirection: "column", marginTop: 36, paddingLeft: 28, borderLeft: "1px solid #ccd5d7" }}>
          <div style={{ display: "flex", fontSize: 19, color: "#627176" }}>{m.practiceLabel}</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: en ? 24 : 27, lineHeight: 1.6 }}>{practice}</div>
        </div>}
      </div>
      <div style={{ display: "flex", marginTop: 28, height: 196, flexShrink: 0, borderTop: "1px solid #ccd5d7", paddingTop: 24, justifyContent: "space-between", gap: 36, alignItems: "center" }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 21, lineHeight: 1.5 }}>{m.note}</div>
          <div style={{ display: "flex", fontSize: 17 }}>{m.imageScan}</div>
        </div>
        <img src={qr} alt="" width={160} height={160} />
      </div>
    </div>,
    { width: 960, height: 1280, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
