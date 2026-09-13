import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { answersForReview } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "请先找回你的测试记录。");
  const data = await answersForReview((await params).id, visitorId);
  if (!data) return fail(404, "NOT_FOUND", "无法查看这份测试的答案。");
  return ok(data, { headers: { "cache-control": "private, no-store" } });
}
