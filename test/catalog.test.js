import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createCatalog, normalizeQuery, FEATURED } from '../src/catalog.js';
import { PREFIXES, GROUP_IDS, TINTABLE, shape } from '../src/collections.js';
const require = createRequire(import.meta.url);
const prefixes = PREFIXES;
const sets = Object.fromEntries(prefixes.map(p => [p, {
  data: shape(p, require(`@iconify-json/${p}/icons.json`)),
  info: require(`@iconify-json/${p}/info.json`)
}]));
const catalog = createCatalog(sets);
test('large offline catalog and legal metadata', () => {
  assert.ok(catalog.count > 35000);
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
  assert.ok(result.items.every(e => e.groups.includes('brands')));
  assert.equal(catalog.search({ group: 'color', prefix: 'lucide' }).total, 0);
  assert.ok(catalog.search({ query: 'home', prefix: 'lucide' }).items.every(e => e.prefix === 'lucide'));
  // An unknown group widens to everything rather than emptying the grid.
  assert.equal(catalog.search({ group: 'colorful' }).total, catalog.count);
});

test('every category is populated, and none of them mixes in the others', () => {
  for (const group of GROUP_IDS) {
    const { total, items } = catalog.search({ group });
    assert.ok(total > 60, `"${group}" only matched ${total} icons`);
    if (group !== 'all') assert.ok(items.every(e => e.groups.includes(group)));
  }
  // Phosphor is split by weight: its duotone icons answer Duotone, the rest Simple.
  assert.ok(catalog.search({ group: 'duotone', prefix: 'ph' }).items.every(e => e.id.endsWith('-duotone')));
  assert.ok(catalog.search({ group: 'simple', prefix: 'ph' }).items.every(e => !e.id.endsWith('-duotone')));
});

test('colour sets keep their palette, duotone and line sets take the tint', () => {
  assert.deepEqual(
    ['solar:rocket-bold-duotone', 'duo-icons:rocket', 'ph:plant-duotone', 'lucide:heart'].filter(id => !TINTABLE.has(id.split(':')[0])),
    []
  );
  assert.match(catalog.icon('solar:rocket-bold-duotone', '#9065b0'), /#9065b0/);
  assert.doesNotMatch(catalog.icon('twemoji:rocket', '#9065b0'), /#9065b0/);
});

test('suggested icons all resolve', () => {
  const missing = FEATURED.filter(id => { try { return !catalog.icon(id); } catch { return true; } });
  assert.deepEqual(missing, []);
  assert.equal(new Set(FEATURED).size, FEATURED.length);
  for (const group of GROUP_IDS) {
    const suggested = catalog.search({ group, limit: 200 }).items.filter(e => FEATURED.includes(e.id));
    assert.ok(suggested.length >= 8, `"${group}" opens on only ${suggested.length} suggested icons`);
  }
});

test('flags answer to country names, not just ISO codes', () => {
  for (const [query, id] of [['france', 'circle-flags:fr'], ['japan', 'circle-flags:jp'], ['brazil', 'circle-flags:br']]) {
    assert.ok(catalog.search({ query }).items.some(e => e.id === id), `"${query}" did not find ${id}`);
  }
  assert.equal(catalog.search({ query: 'france' }).items.find(e => e.prefix === 'circle-flags').name, 'France');
  // Withdrawn ISO codes resolve to their successor state, which would label the
  // Soviet flag "Russia" and put the same country in the grid twice.
  const labels = catalog.search({ prefix: 'circle-flags', limit: 1000 }).items.map(e => e.name);
  const twice = labels.filter((name, i) => labels.indexOf(name) !== i);
  assert.deepEqual(twice, []);
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

test('batch icon lookup answers Saved and Recent in one round trip', () => {
  const ids = ['lucide:heart', 'logos:react', 'tabler:planet'];
  const batch = catalog.icons(ids, '#448361');
  assert.equal(batch.length, 3);
  assert.deepEqual(batch.map(e => e.id), ids);
  for (const entry of batch) assert.match(entry.svg, /^<svg/);
  assert.match(batch[0].svg, /#448361/);
});

test('a stale saved id is dropped instead of failing the whole batch', () => {
  const batch = catalog.icons(['lucide:heart', 'lucide:this-icon-was-removed', 'gone:away'], '#37352f');
  assert.deepEqual(batch.map(e => e.id), ['lucide:heart']);
  assert.deepEqual(catalog.icons('not-an-array'), []);
});

test('page-shaped queries reach icons that do not share their name', () => {
  for (const [query, expected] of [['roadmap', /map|route|flag|milestone/], ['okr', /target|flag|trending|chart/], ['security', /shield|lock|key|fingerprint/]]) {
    assert.ok(catalog.search({ query }).items.some(e => expected.test(e.id)), `"${query}" found nothing relevant`);
  }
});
