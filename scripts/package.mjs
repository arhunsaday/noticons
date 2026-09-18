import { execFileSync } from 'node:child_process';
const files = ['manifest.json', 'background.js', 'content.js', 'catalog.json', 'licenses.json', 'popup.html', 'popup.js', 'notices', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md'];
for (const [folder, browser] of [['dist', 'chrome'], ['dist-firefox', 'firefox']]) {
  execFileSync('zip', ['-q', '-r', `../notion-icons-plus-${browser}.zip`, ...files], { cwd: folder });
  console.log(`Packaged notion-icons-plus-${browser}.zip`);
}
