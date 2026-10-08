import { shareRequest, shareOk } from "@/lib/share-request";
import { shareOptions } from "@/lib/shares";
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) { return shareRequest(req, async (visitor) => shareOk(await shareOptions((await ctx.params).id, visitor))); }
