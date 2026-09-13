import { connection } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { publicProfile } from "@/lib/personality";
import { parseSubmission } from "@/lib/questionnaires";
import { createResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

/** Scores a completed questionnaire on the server and stores it for the visitor. */
export async function POST(req: Request) {
  await connection();
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话，请刷新页面后重试。");

  const parsed = parseSubmission(await readJson(req));
  if (!parsed) return fail(400, "INVALID_ANSWERS", "题目或问卷版本不匹配，请检查答案后重新提交。");

  const result = await createResult(visitorId, parsed.answers, req.headers.get("user-agent"), parsed.questionnaire.id);
  return ok({ id: result.id, ...publicProfile(result.profile), questionnaireId: result.questionnaireId, questionCount: result.questionCount }, { status: 201 });
}
