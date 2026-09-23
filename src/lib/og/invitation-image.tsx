import { ImageResponse } from "next/og";
import { BrandLogo, BrandMark, brandLogoWidth } from "@/components/brand/brand-logo";
import type { Locale } from "@/lib/i18n/locale";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { pairingUiMessages } from "@/lib/i18n/messages/pairing-ui";
import { shareMessages } from "@/lib/i18n/messages/share";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";

/**
 * The card a forwarded invitation shows in a chat app. It carries no host data: link previews are
 * fetched and cached by third-party servers, so nothing personal belongs in this image.
 */
export async function renderInvitationImage(locale: Locale) {
  const m = compareMessages[locale];
  const p = pairingMessages[locale];
  const ui = pairingUiMessages[locale];
  const en = locale === "en";
  const fonts = await ogFonts();
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ display: "flex", position: "relative", overflow: "hidden", flexDirection: "column", width: 540, flexShrink: 0, padding: 52, background: "#121718", color: "#edf2f3" }}>
          <div style={{ display: "flex", position: "absolute", right: -120, bottom: -165, opacity: .09 }}>{BrandMark({ tone: "paper", monochrome: true, size: 430 })}</div>
          <div style={{ display: "flex", height: 40 }}>{BrandLogo({ locale, tone: "paper", width: brandLogoWidth(locale, 180) })}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <div style={{ display: "flex", fontSize: en ? 40 : 48, fontWeight: 500, lineHeight: 1.25 }}>{m.invitationHeading}</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 20, lineHeight: 1.6, color: "#cbd6d8" }}>{p.summary}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "38px 50px 24px" }}>
          {ui.outputs.map((text, index) => <div key={text} style={{ display: "flex", flex: 1, alignItems: "center", gap: 20, borderTop: "1px solid #ccd5d7" }}>
            <div style={{ display: "flex", fontSize: 18, color: "#8d7259", width: 30, flexShrink: 0 }}>{`0${index + 1}`}</div>
            <div style={{ display: "flex", flex: 1, fontSize: en ? 24 : 28, lineHeight: 1.5 }}>{text}</div>
          </div>)}
          <div style={{ display: "flex", alignItems: "center", height: 56, flexShrink: 0, borderTop: "1px solid #ccd5d7", fontSize: 17, lineHeight: 1.5, color: "#627176" }}>{p.delayedGeneration}</div>
        </div>
      </div>
      <div style={{ display: "flex", height: 82, flexShrink: 0, alignItems: "center", padding: "18px 52px", background: "#c49473", fontSize: 16 }}>{shareMessages[locale].testNote}</div>
    </div>,
    { width: 1200, height: 630, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
