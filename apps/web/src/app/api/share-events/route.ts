import { shareRequest, shareOk } from "@/lib/share-request";
import { readShareBody, shareEventSchema, isKnownPreview } from "@/lib/share-policy";
import { recordShareEvent } from "@/lib/share-analytics";
import { requestLocale } from "@/lib/i18n/request";
export async function POST(req: Request) { return shareRequest(req, async (visitor) => { const event = shareEventSchema.parse(await readShareBody(req, 2048)); if (!isKnownPreview(req)) await recordShareEvent(visitor, event, requestLocale(req)); return shareOk({ accepted: true }); }, { write: true, limit: 120, window: 60, namespace: "events" }); }
