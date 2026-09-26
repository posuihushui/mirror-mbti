import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, giftAttachSchema } from "@/lib/share-policy";
import { attachGiftToInvitation } from "@/lib/pair-gifts";

/** 请 TA with a gift the host already has: moves one unused gift onto an open invitation of theirs. */
export async function POST(req: Request) {
  return shareRequest(req, async visitor => {
    const { invitationId } = giftAttachSchema.parse(await readShareBody(req));
    return shareOk(await attachGiftToInvitation(visitor, invitationId));
  }, { write: true, limit: 30, namespace: "gift-attach" });
}
