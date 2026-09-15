import { appUrl, priceFen } from "@/lib/env";
import { llmsText } from "@/lib/llms";
import { formatPriceFen } from "@/lib/site";

export function GET() {
  return new Response(llmsText({ baseUrl: appUrl(), priceLabel: formatPriceFen(priceFen()) }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
