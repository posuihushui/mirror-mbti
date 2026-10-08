import { appUrl } from "@/lib/env";
import { defaultLocale } from "@/lib/i18n/locale";
import { llmsFullText } from "@/lib/llms";

export function GET() {
  return new Response(llmsFullText({ baseUrl: appUrl() }, defaultLocale), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
