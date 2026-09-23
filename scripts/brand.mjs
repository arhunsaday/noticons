// Generates every raster brand asset from the geometry below, so the icons in
// the extension and the ones in the store listing can never drift apart.
// Run with `npm run brand`. Output is committed.
import { mkdir, writeFile } from 'node:fs/promises';
import { createCanvas, encodePng } from './raster.mjs';

export const BRAND = {
  name: 'Noticon',
  tagline: 'More icons for Notion',
  ink: '#1F1F1E',       // tile background, matches Notion's dark surface family
  accent: '#2383E2',    // Notion's own blue, so the mark sits inside the product
  light: '#FFFFFFED',
  paper: '#F7F6F3'
};

/**
 * Four icon-shaped cells on a dark tile, one of them accented: "a set of
 * icons, plus one more". Circles and squares alternate on the diagonals so the
 * mark still reads as icons rather than as a generic app grid at 16px.
 */
function drawMark(canvas, { ink = BRAND.ink, cells = BRAND.light, accent = BRAND.accent } = {}) {
  const s = canvas.size;
  canvas.roundRect(0, 0, s, s, s * 0.2232, ink);
  const cell = s * 0.25;
  const start = s * 0.21;
  const far = start + cell + s * 0.08;
  const r = cell / 2;
  canvas.circle(start + r, start + r, r, cells);
  canvas.roundRect(far, start, cell, cell, cell * 0.3, cells);
  canvas.roundRect(start, far, cell, cell, cell * 0.3, cells);
  canvas.circle(far + r, far + r, r, accent);
  return canvas;
}

export function icon(size) {
  const canvas = createCanvas(size);
  drawMark(canvas);
  return encodePng(canvas.toRGBA(), size);
}

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${BRAND.name}">
  <rect width="128" height="128" rx="28.57" fill="${BRAND.ink}"/>
  <circle cx="42.88" cy="42.88" r="16" fill="#ffffff" fill-opacity="0.93"/>
  <rect x="69.12" y="26.88" width="32" height="32" rx="9.6" fill="#ffffff" fill-opacity="0.93"/>
  <rect x="26.88" y="69.12" width="32" height="32" rx="9.6" fill="#ffffff" fill-opacity="0.93"/>
  <circle cx="85.12" cy="85.12" r="16" fill="${BRAND.accent}"/>
</svg>
`;

const SIZES = [16, 32, 48, 128];

await mkdir('extension/icons', { recursive: true });
await mkdir('brand', { recursive: true });
for (const size of SIZES) await writeFile(`extension/icons/icon-${size}.png`, icon(size));
await writeFile('brand/logo.svg', LOGO_SVG);
console.log(`Brand assets: ${SIZES.map(s => `icon-${s}.png`).join(', ')} + brand/logo.svg`);
