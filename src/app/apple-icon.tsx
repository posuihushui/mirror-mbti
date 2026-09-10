import { ImageResponse } from "next/og";
import { BrandAppIcon } from "@/components/brand/brand-logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  // Satori requires native SVG elements.
  return new ImageResponse(BrandAppIcon({ size: size.width }), size);
}
