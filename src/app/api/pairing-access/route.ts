import { z } from "zod";
import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, pairingResultIdSchema } from "@/lib/share-policy";
import { getPairingEligibility, reconcilePaidResult } from "@/lib/pairing-eligibility";
import { listComparisonContinuations, hasUnavailableComparisonContinuation } from "@/lib/comparison-continuations";
async function access(resultId: string, visitor: string) {
  const eligibility = await getPairingEligibility(resultId, visitor);
  const continuations = await listComparisonContinuations(visitor, resultId);
  return { eligibility, continuations, unavailableInvitation: await hasUnavailableComparisonContinuation(visitor, resultId, continuations.map(item => item.id)) };
}
export async function GET(req: Request) {
  return shareRequest(req, async visitor => shareOk(await access(pairingResultIdSchema.parse(new URL(req.url).searchParams.get("resultId")), visitor)), { limit: 60, window: 60, namespace: "pairing-access-read" });
}
export async function POST(req: Request) {
  return shareRequest(req, async visitor => {
    const { resultId } = z.object({ resultId: pairingResultIdSchema }).strict().parse(await readShareBody(req));
    await reconcilePaidResult(resultId, visitor);
    return shareOk(await access(resultId, visitor));
  }, { write: true, limit: 30, window: 60, namespace: "pairing-access-reconcile" });
}
