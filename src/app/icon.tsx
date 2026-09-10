import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/fonts";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -3,
          borderRadius: 14,
        }}
      >
        m
      </div>
    ),
    { ...size, fonts: fonts.filter((f) => f.name === "Manrope") },
  );
}
