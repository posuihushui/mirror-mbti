import { z } from "zod";
import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { appUrl } from "@/lib/env";
import { getVisitorId } from "@/lib/session";
import { isRecoverySameOrigin, readRecoveryBody } from "@/lib/recovery-policy";
import { browserDevice, browserPath, referrerHost } from "@/lib/analytics/browser-policy";

const browserEventSchema = z.object({ id: z.uuid(), path: z.string().min(1).max(512).startsWith("/"), referrer: z.string().max(512).optional() }).strict();

export async function POST(req: Request) {
  await connection();
  if (!isRecoverySameOrigin(req, appUrl())) return new Response(null, { status: 403 });
  const parsed = browserEventSchema.safeParse(await readRecoveryBody(req));
  if (!parsed.success) return new Response(null, { status: 400 });
  const visitor = await getVisitorId();
  if (!visitor) return new Response(null, { status: 401 });
  if (/bot|crawler|spider|preview|HeadlessChrome/i.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  try {
    const info = browserPath(parsed.data.path);
    // Bound writes per signed browser; atomic advisory lock coordinates concurrent requests.
    await db().transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${visitor}, 1))`);
      const recent = await tx.execute<{ count: number }>(sql`select count(*)::int as count from browser_events where visitor_id = ${visitor}::uuid and created_at > now() - interval '1 minute'`);
      if (recent[0].count >= 60) return;
      await tx.insert(schema.visitors).values({ id: visitor }).onConflictDoUpdate({ target: schema.visitors.id, set: { lastSeenAt: new Date() } });
      await tx.insert(schema.browserEvents).values({ id: parsed.data.id, visitorId: visitor, path: info.path, locale: info.locale, device: browserDevice(req.headers.get("user-agent") ?? ""), referrerHost: referrerHost(parsed.data.referrer) }).onConflictDoNothing();
    });
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
