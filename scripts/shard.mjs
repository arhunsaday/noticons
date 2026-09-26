/**
 * Mozilla's add-on validator refuses to parse any file over 5 MB and reports it
 * as an error, not a warning. The bundled catalogue is ~52 MB, and three sets
 * exceed the limit on their own, so each set's icon bodies are split across
 * numbered files that `src/library.js` stitches back together at runtime.
 */
export const SHARD_BYTES = 4 * 1024 * 1024;
export const PARSE_LIMIT = 5 * 1024 * 1024;

/**
 * Splits an Iconify set's `icons` map into objects that each serialise to less
 * than `limit` bytes. An icon body larger than the limit on its own would still
 * produce an oversized shard; none is anywhere near, and the build's own size
 * check is what would catch it.
 */
export function shardIcons(icons, limit = SHARD_BYTES) {
  const shards = [];
  let current = {};
  let size = 2; // the enclosing braces

  for (const [name, body] of Object.entries(icons)) {
    const entry = Buffer.byteLength(JSON.stringify(name)) + Buffer.byteLength(JSON.stringify(body)) + 2;
    if (size > 2 && size + entry > limit) {
      shards.push(current);
      current = {};
      size = 2;
    }
    current[name] = body;
    size += entry;
  }

  if (size > 2) shards.push(current);
  return shards;
}
