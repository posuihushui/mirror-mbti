/* eslint-disable @next/next/no-img-element -- Satori renders a static PNG, not a browser image. */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { shareMessages } from "@/lib/i18n/messages/share";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import type { PublicShareSnapshot } from "@/lib/share-types";

/** Only public snapshots enter this renderer; the URL is supplied by the configured site origin. */
export async function renderShareImage(snapshot: PublicShareSnapshot, publicUrl: string, format: "portrait" | "og" = "portrait") {
  const portrait = format === "portrait";
  const en = snapshot.locale === "en";
  const t = shareMessages[snapshot.locale];
  const [fonts, qr] = await Promise.all([ogFonts(), portrait ? QRCode.toDataURL(publicUrl, { width: 160, margin: 4, errorCorrectionLevel: "M", color: { dark: "#171b1c", light: "#edf2f3" } }) : Promise.resolve(null)]);
  const optional = <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: portrait ? 20 : 17, lineHeight: 1.4 }}>
    {snapshot.typeLabel && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><div>{`${t.referenceType} · ${snapshot.typeLabel}`}</div>{snapshot.typeNote && <div style={{ fontSize: portrait ? 15 : 13, color: "#627176" }}>{snapshot.typeNote}</div>}</div>}
    {snapshot.dimensions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{snapshot.dimensions.map(dimension => <div key={dimension.dimension} style={{ border: "1px solid #ccd5d7", borderRadius: 20, padding: "5px 10px", fontSize: portrait ? 15 : 13 }}>{dimension.label}</div>)}</div>}
  </div>;
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: portrait ? 64 : 44, background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
    <div style={{ display: "flex", height: 44, flexShrink: 0 }}>{BrandLogo({ locale: snapshot.locale, width: brandLogoWidth(snapshot.locale, 194) })}</div>
    {portrait ? <div style={{ display: "flex", flexDirection: "column", width: 832, flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 24, height: 136, flexShrink: 0 }}><div style={{ fontSize: en ? 42 : 48, fontWeight: 500, lineHeight: 1.2 }}>{t.title}</div><div style={{ marginTop: 12, fontSize: 22, lineHeight: 1.4, color: "#627176" }}>{t.subtitle}</div></div>
      <div style={{ display: "flex", flexDirection: "column", height: 450, flexShrink: 0 }}>{snapshot.lines.map((line, index) => <div key={index} style={{ display: "flex", alignItems: "center", height: 150, flexShrink: 0, gap: 24, borderTop: "1px solid #ccd5d7" }}><div style={{ fontSize: 20, color: "#c49473", width: 32, flexShrink: 0 }}>{String(index + 1).padStart(2, "0")}</div><div style={{ fontSize: en ? 32 : 38, lineHeight: 1.5, flex: 1 }}>{line}</div></div>)}</div>
      <div style={{ display: "flex", marginTop: 16, height: 158, flexShrink: 0 }}>{optional}</div>
      <div style={{ display: "flex", marginTop: "auto", height: 220, flexShrink: 0, borderTop: "1px solid #ccd5d7", paddingTop: 24, justifyContent: "space-between", gap: 36, alignItems: "center" }}><div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 16 }}><div style={{ fontSize: 24, lineHeight: 1.5 }}>{snapshot.disclaimer}</div><div style={{ fontSize: 16, lineHeight: 1.5, color: "#627176" }}>{t.testNote}</div><div style={{ fontSize: 17 }}>{t.scan}</div></div>{qr && <img src={qr} alt="" width={160} height={160} />}</div>
    </div> : <div style={{ display: "flex", flex: 1, marginTop: 24, gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", width: 350, flexShrink: 0 }}><div style={{ fontSize: en ? 35 : 42, fontWeight: 500, lineHeight: 1.25 }}>{t.title}</div><div style={{ marginTop: 18, fontSize: 18, lineHeight: 1.5 }}>{t.subtitle}</div><div style={{ display: "flex", marginTop: 24 }}>{optional}</div><div style={{ fontSize: 15, lineHeight: 1.5, marginTop: "auto", paddingTop: 15 }}>{snapshot.disclaimer}</div></div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{snapshot.lines.map((line, index) => <div key={index} style={{ display: "flex", flex: 1, alignItems: "center", borderTop: "1px solid #ccd5d7", gap: 18 }}><div style={{ fontSize: 18, color: "#c49473" }}>{String(index + 1).padStart(2, "0")}</div><div style={{ flex: 1, fontSize: en ? 27 : 32, lineHeight: 1.5 }}>{line}</div></div>)}</div>
    </div>}
  </div>, { width: portrait ? 960 : 1200, height: portrait ? 1280 : 630, fonts, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
