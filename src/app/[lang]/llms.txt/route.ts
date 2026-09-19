import { appUrl } from "@/lib/env";
import { llmsText } from "@/lib/llms";

/** `/en/llms.txt`. Chinese is served from the unprefixed `/llms.txt`, so other locales 404 here. */
export function generateStaticParams() {
  return [{ lang: "en" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en") return new Response("Not found", { status: 404 });
  return new Response(llmsText({ baseUrl: appUrl() }, "en"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
