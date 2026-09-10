import { ImageResponse } from "next/og";
import { OG_FONT_FAMILY, ogFonts } from "@/lib/og/fonts";
import { OgRadar } from "@/lib/og/radar";
import { typeMeta } from "@/lib/personality";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return [{ id: SAMPLE_RESULT_ID }];
}

export default async function ResultOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = (await getResult(id, null)) ?? (await getResult(SAMPLE_RESULT_ID, null))!;
  const { profile, sample } = result;
  const { name, line } = typeMeta(profile.type);
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edf2f3", color: "#171b1c", fontFamily: OG_FONT_FAMILY, padding: "64px 84px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700, letterSpacing: -2 }}>
            {site.brand}
            <span style={{ fontSize: 16, fontWeight: 400, letterSpacing: 4, borderLeft: "1px solid #919b9e", paddingLeft: 18 }}>{site.brandZh}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, letterSpacing: 3, color: "#738087" }}>{sample ? "SAMPLE REPORT · 示例报告" : "PERSONALITY · 性格画像"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 20 }}>
              <span style={{ fontSize: 150, lineHeight: 1, fontWeight: 500, letterSpacing: -9 }}>{profile.type}</span>
              <span style={{ fontSize: 24, letterSpacing: 4 }}>{name}</span>
            </div>
            <div style={{ marginTop: 26, fontSize: 36, lineHeight: 1.45, fontWeight: 500, display: "flex", flexDirection: "column" }}>
              {line.split("\n").map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 16, color: "#829094" }}>认识自己是一段持续的旅程。这份画像用于自我探索，不定义你。</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <OgRadar profile={profile} size={380} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
