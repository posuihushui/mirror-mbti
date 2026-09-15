import { z } from "zod";
import { shareRequest, shareOk } from "@/lib/share-request";
import { invitationOptions } from "@/lib/comparisons";
export async function GET(req: Request) {
  return shareRequest(req, async visitor => shareOk(await invitationOptions(z.uuid().parse(new URL(req.url).searchParams.get("shareId")), visitor)), { limit: 60, namespace: "invitation-options" });
}
