/* Called from either app by npm; package assets beside its traced standalone server. */
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = process.cwd();
const destination = path.join(app, ".next/standalone", path.relative(root, app));
if (!existsSync(path.join(destination, "server.js"))) throw new Error("Standalone server is missing; build the app first.");
for (const asset of [".next/static", "public"]) {
  if (!existsSync(path.join(app, asset))) continue;
  rmSync(path.join(destination, asset), { recursive: true, force: true });
  cpSync(path.join(app, asset), path.join(destination, asset), { recursive: true });
}
console.log("Standalone server and assets ready.");
