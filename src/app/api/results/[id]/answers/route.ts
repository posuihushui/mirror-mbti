import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { requestLocale } from "@/lib/i18n/request";
import { answersForReview } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

const messages = {
  zh: { noSession: "请先找回你的测试记录。", notFound: "无法查看这份测试的答案。" },
  en: { noSession: "Please recover your test records first.", notFound: "The answers for this test aren’t available." },
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const t = messages[requestLocale(request)];
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", t.noSession);
  const data = await answersForReview((await params).id, visitorId);
  if (!data) return fail(404, "NOT_FOUND", t.notFound);
  return ok(data, { headers: { "cache-control": "private, no-store" } });
}
