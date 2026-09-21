import { siteManifest } from "@/lib/manifest";

/** `/en/manifest.webmanifest`. Chinese is served from the unprefixed `/manifest.webmanifest`, so other locales 404 here. */
export function generateStaticParams() {
  return [{ lang: "en" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en") return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(siteManifest("en")), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
