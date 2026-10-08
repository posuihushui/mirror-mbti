import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;
export function createSql(url: string, options: postgres.Options<Record<string, postgres.PostgresType>> = {}) {
  return postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10, ...options });
}
export function createDatabase(sql: postgres.Sql): Db {
  return drizzle(sql, { schema });
}
export { schema };
