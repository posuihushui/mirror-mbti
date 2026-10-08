import { appUrl } from "@/lib/env";
import { defaultLocale } from "@/lib/i18n/locale";
import { llmsText } from "@/lib/llms";

export function GET() {
  return new Response(llmsText({ baseUrl: appUrl() }, defaultLocale), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
