import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
// The demo fixture and its catalogue copy are build artefacts, not shippable
// extension files; both stores flag unexpected extras.
const files = ['manifest.json', 'background.js', 'content.js', 'catalog.json', 'licenses.json', 'popup.html', 'popup.js', 'icons', 'notices', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md', 'LICENSE'];

await mkdir('releases', { recursive: true });

for (const [folder, browser, ext] of [['dist', 'chrome', 'zip'], ['dist-firefox', 'firefox', 'zip']]) {
  const name = `noticons-${browser}-v${pkg.version}.${ext}`;
  const target = resolve('releases', name);
  await rm(target, { force: true });
  execFileSync('zip', ['-q', '-r', '-X', target, ...files], { cwd: folder });
  const { size } = await stat(target);
  console.log(`releases/${name} — ${(size / 1024 / 1024).toFixed(1)} MB`);
}
