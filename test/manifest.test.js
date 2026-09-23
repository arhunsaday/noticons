import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const url = path => new URL(`../${path}`, import.meta.url);
const manifest = JSON.parse(readFileSync(url('extension/manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(url('package.json'), 'utf8'));

test('content script runs on the current Notion app domain and legacy domains', () => {
  const matches = manifest.content_scripts.flatMap(s => s.matches);
  for (const host of ['app.notion.com', 'www.notion.so', 'notion.so', 'www.notion.com', 'notion.com', 'app.notion.so']) {
    assert.ok(matches.includes(`https://${host}/*`), `Missing ${host}`);
  }
  assert.ok(matches.every(pattern => /^https:\/\/(www\.|app\.)?notion\.(so|com)\/\*$/.test(pattern)));
});

test('asks for nothing beyond local storage', () => {
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
});

test('every store-required icon size is declared and present', () => {
  for (const size of ['16', '32', '48', '128']) {
    const path = manifest.icons[size];
    assert.equal(path, `icons/icon-${size}.png`, `icons.${size} is wrong`);
    assert.equal(manifest.action.default_icon[size], path, `action icon ${size} is wrong`);
    assert.ok(existsSync(url(`extension/${path}`)), `${path} has not been generated — run npm run brand`);
  }
});

test('version comes from package.json at build time', () => {
  // The sentinel is what scripts/build.mjs replaces; a real version here would
  // mean two places to bump and one of them going stale.
  assert.equal(manifest.version, '0.0.0');
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test('store listing fields the reviewers check are filled in', () => {
  assert.ok(manifest.name.length > 0 && manifest.name.length <= 75);
  assert.ok(manifest.short_name.length <= 12);
  assert.ok(manifest.description.length > 0 && manifest.description.length <= 132);
  assert.match(manifest.homepage_url, /^https:\/\//);
});

test('the library shortcut is reassignable by the user', () => {
  assert.ok(manifest.commands['open-picker'].description);
  assert.equal(manifest.commands['open-picker'].suggested_key.default, 'Alt+Shift+I');
});
