// Generates the PWA icons (AL-RAWASI monogram on navy) into public/icons/.
// Run with: node scripts/generate-pwa-icons.js
const sharp = require("sharp");
const { mkdirSync } = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "public", "icons");
mkdirSync(OUT, { recursive: true });

// Truck glyph + AL-RAWASI wordmark on the brand navy. The maskable variant
// keeps content inside the 80% safe zone required by Android launchers.
function logoSvg(size, { maskable = false }) {
  const pad = maskable ? size * 0.16 : size * 0.08;
  const inner = size - pad * 2;
  return Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.18}" fill="#0b1b3a"/>
  <g transform="translate(${pad}, ${pad})">
    <text x="${inner / 2}" y="${inner * 0.34}" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="900"
      font-size="${inner * 0.30}" fill="#ffffff" letter-spacing="${inner * 0.005}">AR</text>
    <text x="${inner / 2}" y="${inner * 0.52}" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="700"
      font-size="${inner * 0.105}" fill="#38bdf8" letter-spacing="${inner * 0.03}">AL-RAWASI</text>
    <!-- truck silhouette -->
    <g transform="translate(${inner * 0.14}, ${inner * 0.60}) scale(${inner / 340})">
      <rect x="0" y="30" width="150" height="70" rx="8" fill="#38bdf8"/>
      <path d="M150 45 h55 l35