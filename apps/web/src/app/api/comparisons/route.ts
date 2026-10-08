import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, comparisonInputSchema } from "@/lib/share-policy";
import { joinComparison } from "@/lib/comparisons";
export async function POST(req: Request) {
  return shareRequest(req, async visitor => {
    const result = await joinComparison(visitor, comparisonInputSchema.parse(await readShareBody(req)));
    return shareOk(result.item, result.created ? 201 : 200);
  }, { write: true, limit: 30, namespace: "comparison-create" });
}
