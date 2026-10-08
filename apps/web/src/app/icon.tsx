import { ImageResponse } from "next/og";
import { BrandAppIcon } from "@/components/brand/brand-logo";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  // Satori requires native SVG elements.
  return new ImageResponse(BrandAppIcon({ size: size.width }), size);
}
