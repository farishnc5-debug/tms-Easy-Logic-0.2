// Generates the AL-RAWASI PWA app icons from SVG → PNG using sharp.
// Run: node scripts/gen-icons.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

const NAVY = "#0b1b3a";
const SKY = "#38bdf8";

// "any" icon: rounded-square navy card with the Easy Logic "EL" monogram
function standardSvg(size) {
  const r = Math.round(size * 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${NAVY}"/>
    <text x="50%" y="45%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="800"
      font-size="${size * 0.42}" fill="#ffffff">E<tspan fill="${SKY}">L</tspan></text>
    <text x="50%" y="72%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="${size * 0.015}"
      font-size="${size * 0.105}" fill="${SKY}">EASY LOGIC</text>
  </svg>`;
}

// "maskable" icon: full-bleed navy (safe zone) so Android can crop to any shape
function maskableSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${NAVY}"/>
    <text x="50%" y="46%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="800"
      font-size="${size * 0.34}" fill="#ffffff">E<tspan fill="${SKY}">L</tspan></text>
    <text x="50%" y="66%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="${size * 0.012}"
      font-size="${size * 0.088}" fill="${SKY}">EASY LOGIC</text>
  </svg>`;
}

async function render(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, file));
  console.log("wrote", file);
}

(async () => {
  await render(standardSvg(192), "icon-192.png");
  await render(standardSvg(512), "icon-512.png");
  await render(maskableSvg(192), "icon-maskable-192.png");
  await render(maskableSvg(512), "icon-maskable-512.png");
  // Apple touch icon (iPhone home screen) — 180px, non-transparent
  await render(standardSvg(180), "apple-touch-icon.png");
  console.log("done");
})();
