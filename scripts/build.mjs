import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const prefixes = ['lucide', 'tabler', 'ph', 'simple-icons', 'devicon', 'logos', 'fluent-emoji-flat', 'flat-color-icons'];
await mkdir('dist', { recursive: true });
const catalog = {};
for (const prefix of prefixes) {
  const base = require.resolve(`@iconify-json/${prefix}/icons.json`);
  catalog[prefix] = {
    data: JSON.parse(await readFile(base, 'utf8')),
    info: JSON.parse(await readFile(require.resolve(`@iconify-json/${prefix}/info.json`), 'utf8'))
  };
  if (prefix === 'flat-color-icons') catalog[prefix].info.license.url = 'https://github.com/icons8/flat-color-icons#good-boy-license';
}
await writeFile('dist/catalog.json', JSON.stringify(catalog));
await writeFile('dist/licenses.json', JSON.stringify(Object.fromEntries(Object.entries(catalog).map(([p, v]) => [p, v.info])), null, 2));
await build({ entryPoints: ['src/content.js'], bundle: true, outfile: 'dist/content.js', target: 'chrome120', format: 'iife' });
await build({ entryPoints: ['src/popup.js'], bundle: true, outfile: 'dist/popup.js', target: 'chrome120', format: 'iife' });
await build({ entryPoints: ['src/background.js'], bundle: true, outfile: 'dist/background.js', target: 'chrome120', format: 'esm' });
await build({ entryPoints: ['demo/demo.js'], bundle: true, outfile: 'dist/demo.js', target: 'chrome120', format: 'esm' });
for (const file of ['manifest.json', 'popup.html']) await copyFile(`extension/${file}`, `dist/${file}`);
await copyFile('demo/index.html', 'dist/index.html');
await cp('notices', 'dist/notices', { recursive: true });
await copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
await copyFile('PRIVACY.md', 'dist/PRIVACY.md');
await copyFile('node_modules/fuse.js/LICENSE', 'dist/notices/fuse.txt');
await copyFile('node_modules/@iconify/utils/license.txt', 'dist/notices/iconify-utils.txt');
await mkdir('dist-firefox', { recursive: true });
for (const file of ['content.js', 'background.js', 'catalog.json', 'licenses.json', 'popup.html', 'popup.js', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md']) await copyFile(`dist/${file}`, `dist-firefox/${file}`);
await cp('dist/notices', 'dist-firefox/notices', { recursive: true });
const firefoxManifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
firefoxManifest.background = { scripts: ['background.js'] };
firefoxManifest.browser_specific_settings = { gecko: { id: 'notion-icons-plus@local.extension', strict_min_version: '128.0', data_collection_permissions: { required: ['none'] } } };
await writeFile('dist-firefox/manifest.json', JSON.stringify(firefoxManifest, null, 2));
console.log(`Built ${Object.values(catalog).reduce((n, s) => n + Object.keys(s.data.icons).length, 0).toLocaleString()} icons across ${prefixes.length} collections → dist/`);
