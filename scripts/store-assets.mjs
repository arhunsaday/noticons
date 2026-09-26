// Captures the store promo tiles from store/promo.html using whichever Chrome
// is already on the machine. Headless Chrome is the only renderer here that
// can lay out real text, which is why these are not drawn by scripts/raster.mjs.
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, rmSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const chrome = CANDIDATES.find(existsSync);
if (!chrome) {
  console.error('No Chrome or Chromium found. Set CHROME_PATH to the binary, then re-run.');
  process.exit(1);
}

const TILES = [
  { id: 'small', width: 440, height: 280, name: 'promo-440x280.png' },
  { id: 'marquee', width: 1400, height: 560, name: 'marquee-1400x560.png' }
];

await mkdir('brand/store', { recursive: true });

for (const tile of TILES) {
  const url = `file://${resolve('store/promo.html')}?only=${tile.id}`;
  // A fresh profile per capture: Chrome holds a lock on the directory briefly
  // after exit, and the second run hangs waiting for it.
  const profile = resolve(tmpdir(), `noticons-shot-${process.pid}-${tile.id}`);
  const out = resolve('brand/store', tile.name);
  rmSync(out, { force: true });
  try {
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      // Without these, headless=new writes the screenshot and then sits on a
      // first-run or search-engine-choice screen instead of exiting.
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-search-engine-choice-screen',
      '--disable-features=Translate,MediaRouter',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profile}`,
      `--window-size=${tile.width},${tile.height}`,
      '--virtual-time-budget=2000',
      `--screenshot=${out}`,
      url
    ], { stdio: 'ignore', timeout: 60_000 });
  } catch (error) {
    // Chrome is known to linger after writing the file. A written screenshot
    // is the result we came for; only a missing one is a failure.
    if (error.code !== 'ETIMEDOUT' || !existsSync(out)) throw error;
  }
  await rm(profile, { recursive: true, force: true });
  if (!existsSync(out)) throw new Error(`Chrome produced no ${tile.name}`);
  console.log(`brand/store/${tile.name} — ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
console.log('\nStill to capture by hand: at least one 1280×800 screenshot of the picker open on a real Notion page.');
