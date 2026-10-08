/* Runs pending SQL migrations from packages/db/drizzle. Used by `npm run db:migrate` and the Docker `migrate` service. */
import nextEnv from "@next/env";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  // Match next dev locally; explicitly supplied environment variables retain priority.
  nextEnv.loadEnvConfig(path.resolve(import.meta.dirname, "../../../apps/web"), process.env.NODE_ENV !== "production");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle") });
    console.log("Migrations applied");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
