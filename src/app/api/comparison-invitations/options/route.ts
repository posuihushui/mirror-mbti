import { shareRequest, shareOk } from "@/lib/share-request";
import { invitationOptions } from "@/lib/comparisons";
export async function GET(req: Request) {
  return shareRequest(req, async visitor => {
    const params = new URL(req.url).searchParams;
    return shareOk(await invitationOptions(params.get("resultId") ?? undefined, visitor, params.get("shareId") ?? undefined));
  }, { limit: 60, namespace: "invitation-options" });
}
