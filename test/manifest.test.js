import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
test('content script runs on the current Notion app domain and legacy domains', () => {
  const matches = manifest.content_scripts.flatMap(s => s.matches);
  for (const host of ['app.notion.com', 'www.notion.so', 'notion.so', 'www.notion.com', 'notion.com', 'app.notion.so']) assert.ok(matches.includes(`https://${host}/*`), `Missing ${host}`);
  assert.ok(matches.every(pattern => /^https:\/\/(www\.|app\.)?notion\.(so|com)\/\*$/.test(pattern)));
});
