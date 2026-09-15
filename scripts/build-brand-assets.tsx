/** Export the shared brand artwork. Run with `npm run brand:build`. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { BRAND_COLORS, BrandLogo, BrandMark } from "../src/components/brand/brand-logo";

const root = process.cwd();
const assets = path.join(root, "public/assets/brand");
const evidence = path.join(root, "docs/brand");

function portable(svg: string, title: string) {
  return svg.replace(/^<svg([^>]*)>/, (_, attributes: string) =>
    `<svg${attributes.replace(/ aria-hidden="true"/, "")} role="img"><title>${title}</title>`,
  );
}

function appIcon(size: number) {
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" fill={BRAND_COLORS.paper} />
      <g transform="translate(8 8) scale(.75)"><BrandMark /></g>
    </svg>,
  );
}

async function main() {
  await Promise.all([mkdir(assets, { recursive: true }), mkdir(evidence, { recursive: true })]);
  for (const variant of [
    { name: "ink", tone: "ink", monochrome: false },
    { name: "paper", tone: "paper", monochrome: false },
    { name: "mono", tone: "ink", monochrome: true },
    { name: "mono-paper", tone: "paper", monochrome: true },
  ] as const) {
    const { name, ...props } = variant;
    for (const [kind, artwork] of [["logo", <BrandLogo key="logo" {...props} />], ["mark", <BrandMark key="mark" {...props} />]] as const) {
      const svg = portable(renderToStaticMarkup(artwork), `观己 mirror · ${kind} ${name}`);
      await writeFile(path.join(assets, `${kind}-${name}.svg`), `${svg}\n`);
    }
    const en = portable(renderToStaticMarkup(<BrandLogo {...props} locale="en" />), `mirror · look within · logo ${name}`);
    await writeFile(path.join(assets, `logo-en-${name}.svg`), `${en}\n`);
  }

  await writeFile(path.join(assets, "app-icon.svg"), portable(appIcon(512), "观己 mirror"));
  for (const size of [64, 180, 192, 512]) {
    await sharp(Buffer.from(appIcon(size))).png().toFile(path.join(assets, `icon-${size}.png`));
  }
  await sharp(Buffer.from(appIcon(512))).png().toFile(path.join(assets, "icon-maskable-512.png"));

  // ICO directory containing PNG images; no extra icon conversion dependency.
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map((size) => sharp(Buffer.from(appIcon(size))).png().toBuffer()));
  const directory = Buffer.alloc(6 + 16 * sizes.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    directory[entry] = sizes[index];
    directory[entry + 1] = sizes[index];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(image.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  await writeFile(path.join(root, "src/app/favicon.ico"), Buffer.concat([directory, ...images]));

  const board = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill={BRAND_COLORS.paper} />
      <rect x="600" width="600" height="520" fill={BRAND_COLORS.night} />
      <g fontFamily="Arial, sans-serif" fontSize="11" letterSpacing="2" fill="#758084">
        <text x="52" y="48">MIRROR / BRAND IDENTITY</text>
        <text x="652" y="48">REVERSED / PAPER ON INK</text>
        <text x="52" y="566">SYMBOL</text>
        <text x="338" y="566">MONOCHROME</text>
        <text x="694" y="566">APP ICON</text>
        <text x="961" y="566">16 / 32 / 64 PX</text>
      </g>
      <g transform="translate(231 98)"><BrandMark size={138} /></g>
      <g transform="translate(124 321)"><BrandLogo width={352} /></g>
      <g transform="translate(831 98)"><BrandMark size={138} tone="paper" /></g>
      <g transform="translate(724 321)"><BrandLogo width={352} tone="paper" /></g>
      <path d="M52 520H1148" stroke="#d2dcdf" />
      <g transform="translate(59 604)"><BrandMark size={108} /></g>
      <g transform="translate(341 616)"><BrandLogo width={265} monochrome /></g>
      <rect x="694" y="596" width="128" height="128" rx="28" fill={BRAND_COLORS.paper} stroke="#d2dcdf" />
      <g transform="translate(710 612)"><BrandMark size={96} /></g>
      <g transform="translate(962 635)"><BrandMark size={16} /></g>
      <g transform="translate(1001 627)"><BrandMark size={32} /></g>
      <g transform="translate(1058 611)"><BrandMark size={64} /></g>
      <path d="M52 756H1148" stroke="#d2dcdf" />
      <text x="52" y="783" fontFamily="Arial, sans-serif" fontSize="10" letterSpacing="1.4" fill="#758084">A LITTLE CLOSER TO YOU</text>
      <text x="900" y="783" fontFamily="Arial, sans-serif" fontSize="10" letterSpacing="1.4" fill="#758084">#EDF2F3 / #171B1C / #C49473</text>
    </svg>,
  );
  await sharp(Buffer.from(board)).png().toFile(path.join(evidence, "logo-preview.png"));
  console.log("Exported SVG logos, app icons, favicon and docs/brand/logo-preview.png");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
