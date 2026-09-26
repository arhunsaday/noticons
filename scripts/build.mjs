import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, cp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { PREFIXES, shape } from '../src/collections.js';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));

await rm('dist', { recursive: true, force: true });
await rm('dist-firefox', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

/* ── icon catalogue ─────────────────────────────────────────────────── */

const catalog = {};
for (const prefix of PREFIXES) {
  catalog[prefix] = {
    data: shape(prefix, JSON.parse(await readFile(require.resolve(`@iconify-json/${prefix}/icons.json`), 'utf8'))),
    info: JSON.parse(await readFile(require.resolve(`@iconify-json/${prefix}/info.json`), 'utf8'))
  };
  // Iconify ships this one without a resolvable licence URL.
  if (prefix === 'flat-color-icons') catalog[prefix].info.license.url = 'https://github.com/icons8/flat-color-icons#good-boy-license';
}
await writeFile('dist/catalog.json', JSON.stringify(catalog));
await writeFile('dist/licenses.json', JSON.stringify(Object.fromEntries(Object.entries(catalog).map(([p, v]) => [p, v.info])), null, 2));

/* ── code ───────────────────────────────────────────────────────────── */

const common = { bundle: true, target: ['chrome120', 'firefox128'], legalComments: 'none' };
await build({ ...common, entryPoints: ['src/content.js'], outfile: 'dist/content.js', format: 'iife' });
await build({ ...common, entryPoints: ['src/popup.js'], outfile: 'dist/popup.js', format: 'iife' });
await build({ ...common, entryPoints: ['src/background.js'], outfile: 'dist/background.js', format: 'esm' });
await build({ ...common, entryPoints: ['demo/demo.js'], outfile: 'dist/demo.js', format: 'esm' });

/* ── static files ───────────────────────────────────────────────────── */

// package.json is the single source of truth for the version. The checked-in
// manifest carries a 0.0.0 sentinel so the two can never disagree.
const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
if (manifest.version !== '0.0.0') throw new Error('extension/manifest.json should keep the 0.0.0 version sentinel');
manifest.version = pkg.version;

await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2));
await copyFile('extension/popup.html', 'dist/popup.html');
await cp('extension/icons', 'dist/icons', { recursive: true });
await copyFile('demo/index.html', 'dist/index.html');
await cp('notices', 'dist/notices', { recursive: true });
await copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
await copyFile('PRIVACY.md', 'dist/PRIVACY.md');
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('node_modules/fuse.js/LICENSE', 'dist/notices/fuse.txt');
await copyFile('node_modules/@iconify/utils/license.txt', 'dist/notices/iconify-utils.txt');

/* ── Firefox build ──────────────────────────────────────────────────── */

await mkdir('dist-firefox', { recursive: true });
const shared = ['content.js', 'background.js', 'catalog.json', 'licenses.json', 'popup.html', 'popup.js', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md', 'LICENSE'];
for (const file of shared) await copyFile(`dist/${file}`, `dist-firefox/${file}`);
await cp('dist/notices', 'dist-firefox/notices', { recursive: true });
await cp('extension/icons', 'dist-firefox/icons', { recursive: true });

const firefox = structuredClone(manifest);
// Gecko still runs MV3 background code in an event page, not a worker.
firefox.background = { scripts: ['background.js'] };
firefox.browser_specific_settings = {
  gecko: {
    id: 'noticons@arhunsaday.github.io',
    strict_min_version: '128.0',
    data_collection_permissions: { required: ['none'] }
  }
};
await writeFile('dist-firefox/manifest.json', JSON.stringify(firefox, null, 2));

const total = Object.values(catalog).reduce((n, s) => n + Object.keys(s.data.icons).length, 0);
console.log(`Noticons v${pkg.version} — ${total.toLocaleString()} icons across ${PREFIXES.length} collections → dist/, dist-firefox/`);
