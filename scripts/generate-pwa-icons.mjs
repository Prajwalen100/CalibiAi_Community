import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

// The CalibiAI mark, extracted from public/images/calibiai-logo.svg (viewBox 0 0 780 540).
const MARK = `
  <g stroke="COLOR" fill="COLOR">
    <path d="M292 28 H115 A87 87 0 0 0 28 115 V417 A87 87 0 0 0 115 504 H292" fill="none" stroke-width="52"/>
    <path d="M545 24 L600 24 L536 516 L470 516 Z" stroke="none"/>
    <path d="M545 24 L600 24 L752 516 L672 516 Z" stroke="none"/>
    <rect x="512" y="390" width="190" height="46" stroke="none"/>
    <g stroke-width="14" stroke-linecap="round">
      <line x1="357" y1="38" x2="171" y2="168"/><line x1="357" y1="38" x2="171" y2="353"/>
      <line x1="357" y1="38" x2="526" y2="272"/><line x1="357" y1="492" x2="171" y2="168"/>
      <line x1="357" y1="492" x2="171" y2="353"/><line x1="357" y1="492" x2="526" y2="272"/>
      <line x1="171" y1="168" x2="357" y2="202"/><line x1="171" y1="168" x2="357" y2="327"/>
      <line x1="171" y1="353" x2="357" y2="202"/><line x1="171" y1="353" x2="357" y2="327"/>
      <line x1="357" y1="202" x2="526" y2="272"/><line x1="357" y1="327" x2="526" y2="272"/>
    </g>
    <g stroke="none">
      <circle cx="357" cy="38" r="42"/><circle cx="171" cy="168" r="42"/><circle cx="357" cy="202" r="40"/>
      <circle cx="526" cy="272" r="42"/><circle cx="357" cy="327" r="40"/><circle cx="171" cy="353" r="42"/>
      <circle cx="357" cy="492" r="42"/>
    </g>
  </g>`;

/**
 * `scale` is the fraction of the canvas width the 780-wide mark occupies.
 * Maskable icons keep the mark inside the 80% safe zone that Android crops to.
 */
function squareSvg({ size, scale, bg, fg, radius }) {
  const markW = size * scale;
  const markH = markW * (540 / 780);
  const x = (size - markW) / 2;
  const y = (size - markH) / 2;
  const bgEl = radius
    ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>`
    : `<rect width="${size}" height="${size}" fill="${bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgEl}
  <svg x="${x}" y="${y}" width="${markW}" height="${markH}" viewBox="0 0 780 540">${MARK.replaceAll("COLOR", fg)}</svg>
</svg>`;
}

const NAVY = "#111C38";
const WHITE = "#ffffff";

const jobs = [
  // Standard "any" icons: navy plate, white mark. Reads well on both iOS and Android.
  ...[192, 256, 384, 512].map((s) => ({
    file: `icon-${s}.png`,
    svg: squareSvg({ size: s, scale: 0.68, bg: NAVY, fg: WHITE, radius: s * 0.22 }),
    size: s,
  })),
  // Maskable icons: full-bleed navy so Android can crop to any shape without clipping the mark.
  ...[192, 512].map((s) => ({
    file: `icon-maskable-${s}.png`,
    svg: squareSvg({ size: s, scale: 0.54, bg: NAVY, fg: WHITE, radius: 0 }),
    size: s,
  })),
  // Apple touch icon: iOS applies its own mask, so ship it square and full-bleed.
  { file: "apple-touch-icon.png", svg: squareSvg({ size: 180, scale: 0.62, bg: NAVY, fg: WHITE, radius: 0 }), size: 180 },
  // Small favicons.
  { file: "favicon-32.png", svg: squareSvg({ size: 32, scale: 0.78, bg: NAVY, fg: WHITE, radius: 6 }), size: 32 },
  { file: "favicon-16.png", svg: squareSvg({ size: 16, scale: 0.82, bg: NAVY, fg: WHITE, radius: 3 }), size: 16 },
  // Monochrome shortcut/badge glyph.
  { file: "badge-96.png", svg: squareSvg({ size: 96, scale: 0.8, bg: "#00000000", fg: WHITE, radius: 0 }), size: 96 },
];

for (const job of jobs) {
  await sharp(Buffer.from(job.svg)).png({ compressionLevel: 9 }).toFile(`${OUT}/${job.file}`);
  console.log("wrote", job.file);
}

// Multi-resolution favicon.ico for legacy browsers and the Safari tab strip.
const ico16 = await sharp(Buffer.from(squareSvg({ size: 16, scale: 0.82, bg: NAVY, fg: WHITE, radius: 3 }))).png().toBuffer();
const ico32 = await sharp(Buffer.from(squareSvg({ size: 32, scale: 0.78, bg: NAVY, fg: WHITE, radius: 6 }))).png().toBuffer();
const ico48 = await sharp(Buffer.from(squareSvg({ size: 48, scale: 0.76, bg: NAVY, fg: WHITE, radius: 9 }))).png().toBuffer();
const entries = [
  { size: 16, buf: ico16 },
  { size: 32, buf: ico32 },
  { size: 48, buf: ico48 },
];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let offset = 6 + entries.length * 16;
const dir = [];
for (const e of entries) {
  const d = Buffer.alloc(16);
  d.writeUInt8(e.size === 256 ? 0 : e.size, 0);
  d.writeUInt8(e.size === 256 ? 0 : e.size, 1);
  d.writeUInt8(0, 2);
  d.writeUInt8(0, 3);
  d.writeUInt16LE(1, 4);
  d.writeUInt16LE(32, 6);
  d.writeUInt32LE(e.buf.length, 8);
  d.writeUInt32LE(offset, 12);
  offset += e.buf.length;
  dir.push(d);
}
writeFileSync("app/favicon.ico", Buffer.concat([header, ...dir, ...entries.map((e) => e.buf)]));
console.log("wrote app/favicon.ico");
