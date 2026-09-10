/* Copies static assets next to the standalone server so `npm start` works like the Docker image. */
import { cpSync, existsSync, rmSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const standalone = `${root}.next/standalone`;
if (!existsSync(standalone)) {
  console.log("no standalone output; skipping");
  process.exit(0);
}
rmSync(`${standalone}/.next/static`, { recursive: true, force: true });
cpSync(`${root}.next/static`, `${standalone}/.next/static`, { recursive: true });
rmSync(`${standalone}/public`, { recursive: true, force: true });
cpSync(`${root}public`, `${standalone}/public`, { recursive: true });
console.log("standalone ready: .next/standalone (static + public copied)");
