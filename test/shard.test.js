import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARSE_LIMIT, SHARD_BYTES, shardIcons } from '../scripts/shard.mjs';

const icons = size => Object.fromEntries(
  Array.from({ length: size }, (_, n) => [`icon-${n}`, { body: `<path d="${'M0 0 '.repeat(40)}"/>`, width: 24 }])
);

test('a set that already fits stays in one shard', () => {
  const set = icons(10);
  const shards = shardIcons(set);
  assert.equal(shards.length, 1);
  assert.deepEqual(shards[0], set);
});

test('every shard stays under the limit Mozilla will parse', () => {
  const shards = shardIcons(icons(4000), 64 * 1024);
  assert.ok(shards.length > 1, 'this set should have needed splitting');
  for (const shard of shards) {
    assert.ok(Buffer.byteLength(JSON.stringify(shard)) <= 64 * 1024);
  }
  assert.ok(SHARD_BYTES < PARSE_LIMIT, 'the shard budget must leave headroom under the parse limit');
});

test('sharding and reassembling is lossless, which is what keeps icons from vanishing', () => {
  const set = icons(2500);
  const shards = shardIcons(set, 32 * 1024);
  const rebuilt = Object.assign({}, ...shards);
  assert.deepEqual(rebuilt, set);
  assert.equal(Object.keys(rebuilt).length, Object.keys(set).length);
  // Names must not appear twice: Object.assign would hide a duplicate by
  // overwriting it, so the count is checked before the merge as well.
  assert.equal(shards.reduce((n, shard) => n + Object.keys(shard).length, 0), Object.keys(set).length);
});

test('an empty set produces no shards', () => {
  assert.deepEqual(shardIcons({}), []);
});

test('a single body larger than the limit is not silently dropped', () => {
  const huge = { big: { body: 'x'.repeat(200) } };
  const shards = shardIcons(huge, 64);
  assert.equal(shards.length, 1);
  assert.deepEqual(Object.assign({}, ...shards), huge);
});
