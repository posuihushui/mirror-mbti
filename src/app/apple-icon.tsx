import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/fonts";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#edf2f3",
          color: "#171b1c",
          fontFamily: "Manrope",
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: -8,
        }}
      >
        m
      </div>
    ),
    { ...size, fonts: fonts.filter((f) => f.name === "Manrope") },
  );
}
