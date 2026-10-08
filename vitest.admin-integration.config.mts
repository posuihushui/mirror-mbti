import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["apps/admin/tests/integration/admin.test.ts"], fileParallelism: false },
  resolve: { alias: { "server-only": path.resolve(import.meta.dirname, "tests/mocks/server-only.ts"), "@": path.resolve(import.meta.dirname, "apps/admin/src") } },
});
