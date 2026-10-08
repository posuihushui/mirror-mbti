import { connection } from "next/server";
import { renderInvitationImage } from "@/lib/og/invitation-image";
import { sessionSecret } from "@/lib/env";
import { getPublicInvitation } from "@/lib/comparisons";
import { shareNoStore, consumeShareRate } from "@/lib/share-request";
import { shareIpBucket } from "@/lib/share-policy";

/** An invitation that is closed, withdrawn or expired has no preview card. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  try { await consumeShareRate(shareIpBucket(request, sessionSecret()), 120, 60); }
  catch { return new Response(null, { status: 429, headers: { ...shareNoStore, "Retry-After": "60" } }); }
  const invitation = await getPublicInvitation(token);
  if (!invitation) return new Response(null, { status: 404, headers: shareNoStore });
  return renderInvitationImage(invitation.locale);
}
