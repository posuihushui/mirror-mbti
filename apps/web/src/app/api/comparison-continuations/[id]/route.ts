import { shareRequest, shareOk } from "@/lib/share-request";
import { deleteComparisonContinuation } from "@/lib/comparison-continuations";
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  return shareRequest(req, async visitor => { await deleteComparisonContinuation((await context.params).id, visitor); return shareOk({ deleted: true }); }, { write: true, limit: 30, window: 60, namespace: "comparison-continuation-delete" });
}
