import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "@/lib/i18n/locale";

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 700; style: "normal" };

const dir = path.join(process.cwd(), "src", "fonts");

async function load(file: string): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(path.join(dir, file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

/**
 * Fonts for `ImageResponse`. satori reads TTF/OTF/WOFF (not WOFF2 and not variable fonts),
 * so Latin uses static Manrope instances and CJK a Noto Sans SC subset covering the site copy.
 * Missing files are skipped so image routes never fail.
 */
export async function ogFonts(): Promise<OgFont[]> {
  const [m400, m500, m700, sc, scMedium] = await Promise.all([
    load("og/manrope-latin-400.woff"),
    load("og/manrope-latin-500.woff"),
    load("og/manrope-latin-700.woff"),
    load("noto-sc-subset.ttf"),
    load("noto-sc-subset-medium.ttf"),
  ]);
  const fonts: OgFont[] = [];
  if (m400) fonts.push({ name: "Manrope", data: m400, weight: 400, style: "normal" });
  if (m500) fonts.push({ name: "Manrope", data: m500, weight: 500, style: "normal" });
  if (m700) fonts.push({ name: "Manrope", data: m700, weight: 700, style: "normal" });
  if (sc) fonts.push({ name: "Noto Sans SC", data: sc, weight: 400, style: "normal" });
  if (scMedium) fonts.push({ name: "Noto Sans SC", data: scMedium, weight: 500, style: "normal" });
  return fonts;
}

export const OG_FONT_FAMILY = 'Manrope, "Noto Sans SC", sans-serif';

/** The home portrait for a locale; the Chinese home has its own (see `app/[lang]/page.tsx`). */
export async function portraitDataUrl(locale: Locale): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "src", "assets", locale === "zh" ? "portrait-zh.jpg" : "portrait.jpg"));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
