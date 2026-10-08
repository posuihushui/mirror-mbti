import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = process.cwd();
nextEnv.loadEnvConfig(app, false);
const server = path.join(app, ".next/standalone", path.relative(root, app), "server.js");
const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT || process.argv[2] || "3000", HOSTNAME: process.argv.includes("--local") ? "localhost" : process.env.HOSTNAME || "localhost" },
});
process.once("SIGINT", () => child.kill("SIGINT"));
process.once("SIGTERM", () => child.kill("SIGTERM"));
child.once("error", error => { console.error(error.message); process.exitCode = 1; });
child.once("exit", code => { process.exitCode = code ?? 1; });
