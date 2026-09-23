import { siteManifest } from "@/lib/manifest";

/** `/zh/manifest.webmanifest`. English is served from the unprefixed `/manifest.webmanifest`. */
export function generateStaticParams() {
  return [{ lang: "zh" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "zh") return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(siteManifest("zh")), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
