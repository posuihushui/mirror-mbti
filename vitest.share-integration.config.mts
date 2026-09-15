import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["tests/integration/share-growth.test.ts"], testTimeout: 15000, hookTimeout: 15000, fileParallelism: false },
  resolve: { alias: { "server-only": path.resolve(import.meta.dirname, "tests/unit/__mocks__/server-only.ts"), "@": path.resolve(import.meta.dirname, "src") } },
});
