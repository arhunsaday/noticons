import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createCatalog, normalizeQuery, GROUPS } from '../src/catalog.js';
const require = createRequire(import.meta.url);
const prefixes = ['lucide', 'tabler', 'ph', 'simple-icons', 'devicon', 'logos', 'fluent-emoji-flat', 'flat-color-icons'];
const sets = Object.fromEntries(prefixes.map(p => [p, { data: require(`@iconify-json/${p}/icons.json`), info: require(`@iconify-json/${p}/info.json`) }]));
const catalog = createCatalog(sets);
test('large offline catalog and legal metadata', () => {
  assert.ok(catalog.count > 10000);
  for (const meta of Object.values(catalog.info)) assert.ok(meta.license.title && meta.license.spdx);
});
test('normalization and fuzzy misspellings', () => {
  assert.equal(normalizeQuery('  React_Native  '), 'react native');
  assert.ok(catalog.search({ query: 'githb', group: 'brands' }).items.some(e => e.id.includes('github')));
});
test('synonyms broaden ideas beyond literal icon names', () => {
  assert.ok(catalog.search({ query: 'todo' }).items.some(e => /check|list|task/.test(e.id)));
  assert.ok(catalog.search({ query: 'learning' }).items.some(e => /book|school|graduation/.test(e.id)));
});
test('category and collection filters intersect', () => {
  const result = catalog.search({ query: 'react', group: 'brands' });
  assert.ok(result.total > 0);
  assert.ok(result.items.every(e => GROUPS.brands.includes(e.prefix)));
  assert.equal(catalog.search({ group: 'colorful', prefix: 'lucide' }).total, 0);
  assert.ok(catalog.search({ query: 'home', prefix: 'lucide' }).items.every(e => e.prefix === 'lucide'));
});
test('stable pagination without duplicates', () => {
  const a = catalog.search({ limit: 30 }); const b = catalog.search({ offset: 30, limit: 30 });
  assert.equal(a.items.length, 30); assert.equal(a.total, b.total);
  assert.ok(!a.items.some(e => b.items.find(f => f.id === e.id)));
});
test('SVG generation resolves data and replaces currentColor safely', () => {
  const svg = catalog.icon('lucide:heart', '#ff0000');
  assert.match(svg, /<svg/); assert.match(svg, /#ff0000/); assert.doesNotMatch(svg, /currentColor/);
  assert.doesNotMatch(catalog.icon('lucide:heart', '" onload="alert(1)'), /onload/);
  assert.throws(() => catalog.icon('unknown:test'));
});
test('every search entry generates a valid SVG', () => {
  for (const p of prefixes) {
    for (const name of Object.keys(sets[p].data.icons)) assert.match(catalog.icon(`${p}:${name}`), /^<svg/);
  }
});
