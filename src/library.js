import { createCatalog } from './catalog.js';

/**
 * Reassembles the sharded icon catalogue.
 *
 * The catalogue is ~52 MB of Iconify JSON, and three sets exceed 5 MB on their
 * own. Mozilla's add-on validator refuses to parse any file over 5 MB and
 * reports it as an error, so the build splits each set's icon bodies across
 * numbered files and records how many in `catalog/index.json`. Everything that
 * is not an icon body — the set's prefix, aliases, default width and height,
 * and its licence metadata — stays in that index, which is well under a
 * megabyte for all eighteen sets together.
 *
 * `resolve` maps a packed path to a URL: `runtime.getURL` in the extension,
 * a relative path in the browser fixture.
 */
export async function loadCatalog(resolve) {
  const index = await getJson(resolve('catalog/index.json'));

  const sets = {};
  await Promise.all(Object.entries(index).map(async ([prefix, entry]) => {
    const shards = await Promise.all(
      Array.from({ length: entry.shards }, (_, n) => getJson(resolve(`catalog/${prefix}.${n}.json`)))
    );
    sets[prefix] = { info: entry.info, data: { ...entry.data, icons: Object.assign({}, ...shards) } };
  }));

  return createCatalog(sets);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Cannot load the bundled icon library');
  return response.json();
}
