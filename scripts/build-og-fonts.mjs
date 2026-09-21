#!/usr/bin/env node
/**
 * Produces the CJK fonts used by `ImageResponse`:
 *  - src/fonts/noto-sc-subset.ttf           Noto Sans SC Regular, subset to the site's Chinese copy
 *  - src/fonts/noto-sc-subset-medium.ttf    Noto Sans SC Medium, same subset
 * Latin comes from the static Manrope WOFF instances in src/fonts/og (from @fontsource/manrope);
 * satori cannot read WOFF2 or variable fonts. The Noto source (~16 MB each) is downloaded once
 * into .cache/ and never committed.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import subsetFont from "subset-font";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const fonts = path.join(root, "src", "fonts");
const cache = path.join(root, ".cache", "fonts");
await mkdir(cache, { recursive: true });

// Characters that can appear in OG images / icons
const sources = ["src/lib/personality.ts", "src/lib/site.ts", "src/lib/og/copy.ts", "src/lib/share-content.ts", "src/lib/i18n/messages/share.ts", "src/lib/i18n/messages/compare.ts", "src/lib/i18n/messages/pairing.ts", "src/lib/i18n/messages/pairing-ui.ts"];
let text = "";
for (const f of sources) {
  try {
    text += await readFile(path.join(root, f), "utf8");
  } catch {}
}
const chars = new Set([...text].filter((c) => /[　-〿一-鿿＀-￯·—…]/.test(c)));
const subsetText = [...chars].join("") + "0123456789%¥";
console.log("CJK glyphs:", chars.size);

const SRC = {
  regular: "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
  medium: "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Medium.otf",
};

async function fetchCached(name, url) {
  const file = path.join(cache, name);
  try {
    if ((await stat(file)).size > 1_000_000) return readFile(file);
  } catch {}
  console.log("downloading", url);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  return buf;
}

for (const [key, out] of [
  ["regular", "noto-sc-subset.ttf"],
  ["medium", "noto-sc-subset-medium.ttf"],
]) {
  const src = await fetchCached(`NotoSansCJKsc-${key}.otf`, SRC[key]);
  const sub = await subsetFont(src, subsetText, { targetFormat: "truetype" });
  await writeFile(path.join(fonts, out), sub);
  console.log(out, Math.round(sub.length / 1024), "kB");
}
