import { ImageResponse } from "next/og";
import { BrandLogo } from "@/components/brand/brand-logo";
import { OG_FONT_FAMILY, ogFonts, portraitDataUrl } from "@/lib/og/fonts";

export const alt = "观己 mirror — 向内看见，真实的自己";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [fonts, portrait] = await Promise.all([ogFonts(), portraitDataUrl()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 0 72px 84px", width: 660 }}>
          {/* Satori requires native SVG elements. */}
          {BrandLogo({ width: 280 })}
          <div style={{ marginTop: 56, fontSize: 14, letterSpacing: 2, color: "#627176" }}>MBTI 测试体验 · 16 型人格探索</div>
          <div style={{ marginTop: 22, fontSize: 68, lineHeight: 1.25, letterSpacing: -3, fontWeight: 500, display: "flex", flexDirection: "column" }}>
            <span>向内看见，</span>
            <span>真实的自己。</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 20, lineHeight: 1.7, color: "#677276" }}>你如何感受世界、与人相处、做出选择？</div>
          <div style={{ marginTop: 34, display: "flex", gap: 28, fontSize: 24, fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              32/64 <span style={{ fontSize: 14, color: "#798286", fontWeight: 400 }}>题可选</span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, borderLeft: "1px solid #d2dcdf", paddingLeft: 28 }}>
              5–10 <span style={{ fontSize: 14, color: "#798286", fontWeight: 400 }}>分钟左右</span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8, borderLeft: "1px solid #d2dcdf", paddingLeft: 28 }}>
              16 <span style={{ fontSize: 14, color: "#798286", fontWeight: 400 }}>种人格倾向</span>
            </span>
          </div>
        </div>
        {portrait && (
          <div style={{ display: "flex", width: 540, height: "100%", overflow: "hidden" }}>
            <img src={portrait} alt="" width={540} height={630} style={{ objectFit: "cover", objectPosition: "50% 30%" }} />
          </div>
        )}
      </div>
    ),
    { ...size, fonts },
  );
}
