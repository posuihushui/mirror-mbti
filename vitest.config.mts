import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    projects: ["web", "admin"].map(app => ({
      extends: true,
      resolve: { alias: { "@": path.resolve(import.meta.dirname, `apps/${app}/src`) } },
      test: { name: app, include: [`apps/${app}/tests/unit/**/*.test.ts`] },
    })),
  },
  resolve: {
    alias: { "server-only": path.resolve(import.meta.dirname, "tests/mocks/server-only.ts") },
  },
});
