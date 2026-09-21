import { connection } from "next/server";
import { renderCompareImage } from "@/lib/og/compare-image";
import { getOwnedComparison } from "@/lib/comparisons";
import { getVisitorId } from "@/lib/session";
import { appUrl } from "@/lib/env";
import { href } from "@/lib/i18n/locale";
import { shareNoStore } from "@/lib/share-request";

/** Owner-only, like the guide itself: only the two signed visitors of this pair may render it. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const visitor = await getVisitorId();
  const pair = visitor ? await getOwnedComparison(id, visitor) : null;
  if (!pair) return new Response(null, { status: 404, headers: shareNoStore });
  const response = await renderCompareImage(pair.outputSnapshot, pair.locale, appUrl() + href(pair.locale, "/pairing"));
  if (new URL(request.url).searchParams.get("download") === "1") response.headers.set("Content-Disposition", 'attachment; filename="mirror-pair-guide.png"');
  return response;
}
