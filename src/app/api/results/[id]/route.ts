import { connection } from "next/server";
import { fail, ok } from "@/lib/api";
import { getResult } from "@/lib/results";
import { getVisitorId } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  const visitorId = await getVisitorId();
  const result = await getResult(id, visitorId);
  if (!result) return fail(404, "NOT_FOUND", "结果不存在。");
  return ok({
    id: result.id,
    ...result.profile,
    sample: result.sample,
    owner: result.owner,
    unlocked: result.owner ? result.unlocked : undefined,
  });
}
