import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getVisitorOpenid(visitorId: string): Promise<string | null> {
  const row = await db().query.visitors.findFirst({ where: eq(schema.visitors.id, visitorId), columns: { wechatOpenid: true } });
  return row?.wechatOpenid ?? null;
}

export async function setVisitorOpenid(visitorId: string, openid: string) {
  await db()
    .insert(schema.visitors)
    .values({ id: visitorId, wechatOpenid: openid })
    .onConflictDoUpdate({ target: schema.visitors.id, set: { wechatOpenid: openid, lastSeenAt: new Date() } });
}
