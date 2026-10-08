import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { getResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";
import { publicProfile } from "@/lib/personality";

const notFound = { zh: "结果不存在。", en: "Result not found." };

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) return fail(404, "NOT_FOUND", notFound[requestLocale(req)]);
  return ok({
    id: result.id,
    ...publicProfile(result.profile),
    questionnaireId: result.questionnaireId,
    questionCount: result.questionCount,
    scoringVersion: result.scoringVersion,
    reportVersion: result.reportVersion,
    sample: result.sample,
    owner: result.owner,
    unlocked: result.owner ? result.unlocked : undefined,
  });
}
