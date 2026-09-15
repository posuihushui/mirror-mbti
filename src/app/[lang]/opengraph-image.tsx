import { connection } from "next/server";
import { homeOgImage } from "@/lib/og/home-image";

export const alt = "mirror — See your true self from within";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * `/en/opengraph-image`. Chinese pages point at the unprefixed root image explicitly (see `pageMetadata`),
 * and a typed `/zh/opengraph-image` is redirected there by the proxy.
 */
export default async function LocaleOpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  return homeOgImage(lang === "en" ? "en" : "zh");
}
