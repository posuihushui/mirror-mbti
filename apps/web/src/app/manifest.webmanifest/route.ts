import { siteManifest } from "@/lib/manifest";

/** English's unprefixed manifest. The locale layout selects each manifest URL explicitly. */
export function GET() {
  return new Response(JSON.stringify(siteManifest("en")), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
