import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(path.resolve(process.cwd(), "../../apps/web"), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://mirror:mirror@localhost:5432/mirror" },
  strict: true,
  verbose: true,
});
