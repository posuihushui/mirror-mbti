import { ImageResponse } from "next/og";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
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
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 60, background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
      <div style={{ display: "flex", height: 44, flexShrink: 0 }}>{BrandLogo({ locale, width: brandLogoWidth(locale, 194) })}</div>
      <div style={{ display: "flex", flex: 1, marginTop: 34, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 560, flexShrink: 0 }}>
          <div style={{ display: "flex", fontSize: en ? 40 : 46, fontWeight: 500, lineHeight: 1.3 }}>{m.invitationHeading}</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 20, lineHeight: 1.6, color: "#627176" }}>{p.summary}</div>
          <div style={{ display: "flex", marginTop: "auto", fontSize: 16, lineHeight: 1.6, color: "#627176" }}>{shareMessages[locale].testNote}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {ui.outputs.map((text, index) => <div key={text} style={{ display: "flex", flex: 1, alignItems: "center", gap: 20, borderTop: "1px solid #ccd5d7" }}>
            <div style={{ display: "flex", fontSize: 18, color: "#c49473", width: 30, flexShrink: 0 }}>{`0${index + 1}`}</div>
            <div style={{ display: "flex", flex: 1, fontSize: en ? 24 : 28, lineHeight: 1.5 }}>{text}</div>
          </div>)}
          <div style={{ display: "flex", alignItems: "center", height: 56, flexShrink: 0, borderTop: "1px solid #ccd5d7", fontSize: 17, lineHeight: 1.5, color: "#627176" }}>{p.delayedGeneration}</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}
