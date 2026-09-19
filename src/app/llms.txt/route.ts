import { appUrl } from "@/lib/env";
import { llmsText } from "@/lib/llms";

export function GET() {
  return new Response(llmsText({ baseUrl: appUrl() }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
