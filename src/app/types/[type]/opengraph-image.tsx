import { ImageResponse } from "next/og";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import { isPersonalityType, poles, TYPES, typeMeta } from "@/lib/personality";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export default async function TypeOgImage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const t = isPersonalityType(type) ? type : "INFJ";
  const { name, line, letters } = typeMeta(t);
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY, padding: "64px 84px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700, letterSpacing: -2 }}>
            {site.brand}
            <span style={{ fontSize: 16, fontWeight: 400, letterSpacing: 4, borderLeft: "1px solid #919b9e", paddingLeft: 18 }}>{site.brandZh}</span>
          </div>
          <div style={{ fontSize: 14, letterSpacing: 3, color: "#738087" }}>PERSONALITY TYPE · 人格倾向</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
          <div style={{ fontSize: 220, lineHeight: 1, fontWeight: 500, letterSpacing: -14 }}>{t}</div>
          <div style={{ display: "flex", flexDirection: "column", paddingBottom: 26 }}>
            <div style={{ fontSize: 28, letterSpacing: 4, color: "#5c6a70" }}>{name}</div>
            <div style={{ marginTop: 18, fontSize: 40, lineHeight: 1.4, fontWeight: 500, letterSpacing: -1, display: "flex", flexDirection: "column" }}>
              {line.split("\n").map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {letters.map((l) => (
            <span key={l} style={{ border: "1px solid #cdd7db", borderRadius: 50, padding: "10px 22px", fontSize: 18, color: "#5c6a70" }}>
              {poles[l].label}倾向 {l}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
