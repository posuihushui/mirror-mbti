import { z } from "zod";
import { shareRequest, shareOk } from "@/lib/share-request";
import { revokeComparisonInvitation } from "@/lib/comparisons";
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return shareRequest(req, async visitor => {
    await revokeComparisonInvitation(z.uuid().parse((await ctx.params).id), visitor);
    return shareOk({ revoked: true });
  }, { write: true, limit: 60, namespace: "invitation-revoke" });
}
