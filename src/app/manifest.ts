import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.brandZh,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: site.themeColor,
    theme_color: site.themeColor,
    lang: "zh-CN",
    icons: [
      { src: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
