import { connection } from "next/server";
import { renderReportImage } from "@/lib/og/report-image";
import { appUrl } from "@/lib/env";
import { href, isLocale } from "@/lib/i18n/locale";
import { questionnaireLocale } from "@/lib/questionnaires";
import { getResult, SAMPLE_RESULT_ID } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { shareNoStore } from "@/lib/share-request";

/**
 * The report summary image. Like the report itself it is owner-only and needs the unlock; the
 * public sample renders for anyone. The QR code always points at the free test.
 */
export async function GET(request: Request, { params }: { params: Promise<{ lang: string; id: string }> }) {
  await connection();
  const { lang, id } = await params;
  const visitor = id === SAMPLE_RESULT_ID ? null : await getVisitorId();
  const result = await getResult(id, visitor);
  if (!result || (!result.sample && !(result.owner && result.unlocked))) return new Response(null, { status: 404, headers: shareNoStore });
  // A real report speaks its questionnaire's language; the sample follows the URL.
  const locale = result.sample ? (isLocale(lang) ? lang : "en") : questionnaireLocale(result.questionnaireId);
  const response = await renderReportImage(result.profile, locale, appUrl() + href(locale, "/quiz"), result.sample);
  if (new URL(request.url).searchParams.get("download") === "1") response.headers.set("Content-Disposition", 'attachment; filename="mirror-report.png"');
  return response;
}
