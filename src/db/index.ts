import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __mirrorSql?: postgres.Sql; __mirrorDb?: Db };

/** Lazily created postgres.js pool, cached on `globalThis` so dev hot reloads don't leak connections. */
export function db(): Db {
  if (globalForDb.__mirrorDb) return globalForDb.__mirrorDb;
  const url = env().DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and point it at Postgres.");
  const sql = (globalForDb.__mirrorSql ??= postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 }));
  globalForDb.__mirrorDb = drizzle(sql, { schema });
  return globalForDb.__mirrorDb;
}

export { schema };
