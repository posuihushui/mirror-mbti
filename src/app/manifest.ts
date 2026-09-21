import type { MetadataRoute } from "next";
import { siteManifest } from "@/lib/manifest";

/** Chinese keeps the unprefixed manifest; `/en/manifest.webmanifest` serves the English one. */
export default function manifest(): MetadataRoute.Manifest {
  return siteManifest("zh");
}
