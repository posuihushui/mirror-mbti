import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, invitationInputSchema } from "@/lib/share-policy";
import { createComparisonInvitation } from "@/lib/comparisons";
export async function POST(req: Request) {
  return shareRequest(req, async visitor => {
    const result = await createComparisonInvitation(visitor, invitationInputSchema.parse(await readShareBody(req)));
    return shareOk(result.item, result.created ? 201 : 200);
  }, { write: true, limit: 20, namespace: "invitation-create" });
}
