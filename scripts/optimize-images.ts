/* Re-encodes a source portrait into the JPEG that `next/image` optimizes at request time.
   npm run optimize:images -- [input] [output] [maxWidth] */
import sharp from "sharp";
import { statSync } from "node:fs";

async function main() {
  const input = process.argv[2] ?? "docs/design-evidence/portrait-source.png";
  const output = process.argv[3] ?? "src/assets/portrait.jpg";
  const maxWidth = Number(process.argv[4]) || 0;

  const image = sharp(input);
  if (maxWidth) image.resize({ width: maxWidth, withoutEnlargement: true });
  await image.jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(output);
  const meta = await sharp(output).metadata();
  console.log(`${output}: ${meta.width}×${meta.height}, ${Math.round(statSync(output).size / 1024)} kB`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
