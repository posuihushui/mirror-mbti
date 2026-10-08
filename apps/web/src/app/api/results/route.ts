import { connection } from "next/server";
import { fail, ok, readJson } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { publicProfile } from "@/lib/personality";
import { getQuestionnaire, parseSubmission } from "@/lib/questionnaires";
import { createResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

const messages = {
  zh: { noSession: "缺少访客会话，请刷新页面后重试。", invalid: "题目或问卷版本不匹配，请检查答案后重新提交。" },
  en: { noSession: "Your visitor session is missing. Please refresh the page and try again.", invalid: "The questions or questionnaire version don’t match. Please check your answers and submit again." },
};

/** Scores a completed questionnaire on the server and stores it for the visitor. */
export async function POST(req: Request) {
  await connection();
  const body = await readJson(req);
  // The submitted questionnaire decides the language when it is known; otherwise the page that posted.
  const version = body && typeof body === "object" && "questionnaireId" in body && typeof body.questionnaireId === "string" ? getQuestionnaire(body.questionnaireId) : undefined;
  const t = messages[version?.locale ?? requestLocale(req)];
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", t.noSession);

  const parsed = parseSubmission(body);
  if (!parsed) return fail(400, "INVALID_ANSWERS", t.invalid);

  const result = await createResult(visitorId, parsed.answers, req.headers.get("user-agent"), parsed.questionnaire.id);
  return ok({ id: result.id, ...publicProfile(result.profile), questionnaireId: result.questionnaireId, questionCount: result.questionCount }, { status: 201 });
}
