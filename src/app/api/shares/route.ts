import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, shareInputSchema } from "@/lib/share-policy";
import { createShare, listOwnedShares } from "@/lib/shares";
export async function POST(req: Request) { return shareRequest(req, async (visitor) => { const result = await createShare(visitor, shareInputSchema.parse(await readShareBody(req))); return shareOk(result.item, result.created ? 201 : 200); }, { write: true, limit: 20, namespace: "create" }); }
export async function GET(req: Request) { return shareRequest(req, async (visitor) => shareOk(await listOwnedShares(visitor, new URL(req.url).searchParams.get("cursor")))); }
