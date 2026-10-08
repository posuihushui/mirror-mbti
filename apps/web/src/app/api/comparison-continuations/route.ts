import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, continuationInputSchema } from "@/lib/share-policy";
import { registerComparisonContinuation } from "@/lib/comparison-continuations";
export async function POST(req: Request) {
  return shareRequest(req, async visitor => shareOk(await registerComparisonContinuation(visitor, continuationInputSchema.parse(await readShareBody(req)))), { write: true, limit: 30, window: 60, namespace: "comparison-continuation" });
}
