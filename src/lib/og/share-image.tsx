/* eslint-disable @next/next/no-img-element -- Satori renders a static PNG, not a browser image. */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { BrandLogo, BrandMark, brandLogoWidth } from "@/components/brand/brand-logo";
import { shareMessages } from "@/lib/i18n/messages/share";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import type { PublicShareSnapshot } from "@/lib/share-types";

/** Only public snapshots enter this renderer; the URL is supplied by the configured site origin. */
export async function renderShareImage(snapshot: PublicShareSnapshot, publicUrl: string, format: "portrait" | "og" = "portrait") {
  const portrait = format === "portrait";
  const en = snapshot.locale === "en";
  const t = shareMessages[snapshot.locale];
  const [fonts, qr] = await Promise.all([ogFonts(), portrait ? QRCode.toDataURL(publicUrl, { width: 160, margin: 4, errorCorrectionLevel: "M", color: { dark: "#171b1c", light: "#edf2f3" } }) : Promise.resolve(null)]);
  const hasOptional = Boolean(snapshot.typeLabel || snapshot.dimensions);
  const optional = <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: portrait ? 20 : 17, lineHeight: 1.4 }}>
    {snapshot.typeLabel && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><div>{`${t.referenceType} · ${snapshot.typeLabel}`}</div>{snapshot.typeNote && <div style={{ fontSize: portrait ? 15 : 13, color: "#627176" }}>{snapshot.typeNote}</div>}</div>}
    {snapshot.dimensions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{snapshot.dimensions.map(dimension => <div key={dimension.dimension} style={{ border: "1px solid #ccd5d7", borderRadius: 20, padding: "5px 10px", fontSize: portrait ? 15 : 13 }}>{dimension.label}</div>)}</div>}
  </div>;
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", width: "100%", height: "100%", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
    {portrait ? <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div style={{ display: "flex", position: "relative", overflow: "hidden", flexDirection: "column", height: 430, flexShrink: 0, padding: 64, background: "#121718", color: "#edf2f3" }}>
        <div style={{ display: "flex", position: "absolute", right: -155, bottom: -185, opacity: .1 }}>{BrandMark({ tone: "paper", monochrome: true, size: 560 })}</div>
        <div style={{ display: "flex", height: 44, flexShrink: 0 }}>{BrandLogo({ locale: snapshot.locale, tone: "paper", width: brandLogoWidth(snapshot.locale, 194) })}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", width: 700 }}>
          <div style={{ fontSize: 19, letterSpacing: 2, color: "#c49473" }}>{t.title}</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginTop: 20 }}>
            <div style={{ width: 32, flexShrink: 0, paddingTop: 10, fontSize: 20, letterSpacing: 1, color: "#c49473" }}>01</div>
            <div style={{ flex: 1, fontSize: en ? 43 : 52, fontWeight: 500, lineHeight: 1.35 }}>{snapshot.lines[0]}</div>
          </div>
          <div style={{ marginTop: 16, fontSize: en ? 21 : 24, lineHeight: 1.45, color: "#bac6c9" }}>{t.subtitle}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "26px 64px 22px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{snapshot.lines.slice(1).map((line, index) => <div key={index} style={{ display: "flex", alignItems: "center", flex: 1, minHeight: 112, gap: 24, borderBottom: "1px solid #ccd5d7" }}><div style={{ fontSize: 20, color: "#8d7259", width: 32, flexShrink: 0 }}>{String(index + 2).padStart(2, "0")}</div><div style={{ fontSize: en ? 29 : 36, lineHeight: 1.5, flex: 1 }}>{line}</div></div>)}</div>
        {hasOptional && <div style={{ display: "flex", marginTop: 18, flexShrink: 0 }}>{optional}</div>}
      </div>
      <div style={{ display: "flex", height: 224, flexShrink: 0, padding: "28px 64px", justifyContent: "space-between", gap: 36, alignItems: "center", background: "#c49473" }}><div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 12 }}><div style={{ fontSize: 22, lineHeight: 1.5 }}>{snapshot.disclaimer}</div><div style={{ fontSize: 16, lineHeight: 1.5, opacity: .72 }}>{t.testNote}</div><div style={{ fontSize: 17 }}>{t.scan}</div></div>{qr && <img src={qr} alt="" width={160} height={160} />}</div>
    </div> : <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ display: "flex", position: "relative", overflow: "hidden", flexDirection: "column", width: 455, flexShrink: 0, padding: 44, background: "#121718", color: "#edf2f3" }}>
          <div style={{ display: "flex", position: "absolute", right: -120, bottom: -165, opacity: .09 }}>{BrandMark({ tone: "paper", monochrome: true, size: 420 })}</div>
          <div style={{ display: "flex", height: 40 }}>{BrandLogo({ locale: snapshot.locale, tone: "paper", width: brandLogoWidth(snapshot.locale, 176) })}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}><div style={{ fontSize: 17, letterSpacing: 2, color: "#c49473" }}>{t.title}</div><div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 16 }}><div style={{ width: 26, flexShrink: 0, paddingTop: 7, fontSize: 16, color: "#c49473" }}>01</div><div style={{ flex: 1, fontSize: en ? 31 : 38, fontWeight: 500, lineHeight: 1.35 }}>{snapshot.lines[0]}</div></div><div style={{ marginTop: 14, fontSize: 17, lineHeight: 1.5, color: "#bac6c9" }}>{t.subtitle}</div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "34px 44px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{snapshot.lines.slice(1).map((line, index) => <div key={index} style={{ display: "flex", flex: 1, alignItems: "center", borderBottom: "1px solid #ccd5d7", gap: 18 }}><div style={{ fontSize: 18, color: "#8d7259" }}>{String(index + 2).padStart(2, "0")}</div><div style={{ flex: 1, fontSize: en ? 25 : 30, lineHeight: 1.45 }}>{line}</div></div>)}</div>
          {hasOptional && <div style={{ display: "flex", marginTop: 16 }}>{optional}</div>}
        </div>
      </div>
      <div style={{ display: "flex", height: 92, flexShrink: 0, alignItems: "center", justifyContent: "space-between", padding: "18px 44px", background: "#c49473", fontSize: 15, lineHeight: 1.45 }}><div style={{ display: "flex", maxWidth: 850 }}>{snapshot.disclaimer}</div><div style={{ display: "flex", opacity: .72 }}>{t.testNote}</div></div>
    </div>}
  </div>, { width: portrait ? 960 : 1200, height: portrait ? 1280 : 630, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
