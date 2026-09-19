import { appUrl } from "@/lib/env";
import { llmsFullText } from "@/lib/llms";

export function GET() {
  return new Response(llmsFullText({ baseUrl: appUrl() }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
