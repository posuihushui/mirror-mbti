/* Re-encodes the source portrait into the JPEG that `next/image` optimizes at request time. */
import sharp from "sharp";
import { statSync } from "node:fs";

const input = process.argv[2] ?? "docs/design-evidence/portrait-source.png";
const output = "src/assets/portrait.jpg";

await sharp(input).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(output);
const meta = await sharp(output).metadata();
console.log(`${output}: ${meta.width}×${meta.height}, ${Math.round(statSync(output).size / 1024)} kB`);
