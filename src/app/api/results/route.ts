import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { QUESTION_COUNT } from "@/lib/personality";
import { createResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

const bodySchema = z.object({
  answers: z.array(z.number().int().min(-2).max(2)).length(QUESTION_COUNT),
});

/** Scores a completed questionnaire on the server and stores it for the visitor. */
export async function POST(req: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话，请刷新页面后重试。");

  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "INVALID_ANSWERS", "答案格式不正确，请重新作答。");

  const result = await createResult(visitorId, parsed.data.answers, req.headers.get("user-agent"));
  return ok({ id: result.id, ...result.profile }, { status: 201 });
}
