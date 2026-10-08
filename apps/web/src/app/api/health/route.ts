import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { env } from "@/lib/env";

/** Liveness + database reachability. */
export async function GET() {
  await connection();
  const started = Date.now();
  try {
    if (env().DATABASE_URL) await db().execute(sql`select 1`);
    return Response.json({ ok: true, db: Boolean(env().DATABASE_URL), latencyMs: Date.now() - started }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "db error" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
