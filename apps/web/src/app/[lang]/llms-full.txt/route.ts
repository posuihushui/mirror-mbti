import { appUrl } from "@/lib/env";
import { llmsFullText } from "@/lib/llms";

/** `/zh/llms-full.txt`. English is served from the unprefixed `/llms-full.txt`. */
export function generateStaticParams() {
  return [{ lang: "zh" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "zh") return new Response("Not found", { status: 404 });
  return new Response(llmsFullText({ baseUrl: appUrl() }, "zh"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
