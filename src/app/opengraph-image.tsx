import { homeOgImage } from "@/lib/og/home-image";

export const alt = "观己 mirror — 向内看见，真实的自己";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Chinese home share card; English lives at `/en/opengraph-image`. */
export default function OpenGraphImage() {
  return homeOgImage("zh");
}
