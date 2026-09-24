/**
 * Every bundled Iconify set, in the order the grid walks them when it is
 * browsed rather than searched. Full-colour sets come first: Notion's own
 * Icons tab already covers monochrome line work, so that is the one thing
 * this extension does not need to lead with.
 *
 * - `groups` — the categories a set answers, or a function of the icon name
 *   for the sets that ship more than one weight.
 * - `tint` — the set is drawn in `currentColor`, so the colour picker repaints
 *   it. Everything else keeps its own palette.
 * - `pick` — narrows a set at build time. Two of them ship far more than a
 *   page-icon picker can use.
 */

const DUOTONE_WEIGHT = /-duotone$/;

// Shared instances so 40,000 entries point at six arrays rather than carrying
// their own.
const BRAND_COLOR = ['brands', 'color'];
const EMOJI_COLOR = ['emoji', 'color'];
const COLOR = ['color'];
const BRANDS = ['brands'];
const DUOTONE = ['duotone'];
const SIMPLE = ['simple'];

export const COLLECTIONS = {
  logos: { groups: BRAND_COLOR },
  devicon: { groups: BRAND_COLOR },
  'skill-icons': { groups: BRAND_COLOR },
  'fluent-emoji-flat': { groups: EMOJI_COLOR },
  twemoji: { groups: EMOJI_COLOR },
  'streamline-emojis': { groups: EMOJI_COLOR },
  'flat-color-icons': { groups: COLOR },
  'fluent-color': { groups: COLOR, pick: largestVariant },
  'streamline-ultimate-color': { groups: COLOR },
  'material-icon-theme': { groups: COLOR },
  catppuccin: { groups: COLOR },
  'circle-flags': { groups: COLOR },
  solar: { groups: DUOTONE, tint: true, pick: names => names.filter(name => DUOTONE_WEIGHT.test(name)) },
  'duo-icons': { groups: DUOTONE, tint: true },
  'simple-icons': { groups: BRANDS, tint: true },
  // Phosphor ships six weights under one prefix. Its duotone weight belongs
  // with the duotone sets; the other five belong with the line sets.
  ph: { groups: name => (DUOTONE_WEIGHT.test(name) ? DUOTONE : SIMPLE), tint: true },
  lucide: { groups: SIMPLE, tint: true },
  tabler: { groups: SIMPLE, tint: true }
};

export const PREFIXES = Object.keys(COLLECTIONS);
export const GROUP_IDS = ['all', 'color', 'emoji', 'brands', 'duotone', 'simple'];
export const TINTABLE = new Set(PREFIXES.filter(prefix => COLLECTIONS[prefix].tint));

export function groupsOf(prefix, name) {
  const groups = COLLECTIONS[prefix]?.groups;
  return typeof groups === 'function' ? groups(name) : groups || [];
}

/**
 * Fluent Color draws every icon at six pixel sizes. A 280 × 280 page icon only
 * ever wants the largest, and the other five turn one concept into six
 * near-identical search hits.
 */
function largestVariant(names) {
  const best = new Map();
  for (const name of names) {
    const match = /^(.*)-(\d+)$/.exec(name);
    const base = match ? match[1] : name;
    const size = match ? Number(match[2]) : 0;
    if (!best.has(base) || best.get(base).size < size) best.set(base, { name, size });
  }
  return [...best.values()].map(entry => entry.name);
}

/** Applies a set's `pick` to raw Iconify data, dropping aliases left dangling. */
export function shape(prefix, data) {
  const pick = COLLECTIONS[prefix]?.pick;
  if (!pick) return data;
  const kept = new Set(pick(Object.keys(data.icons)));
  const icons = {};
  for (const name of kept) icons[name] = data.icons[name];
  const aliases = Object.fromEntries(
    Object.entries(data.aliases || {}).filter(([, alias]) => kept.has(alias.parent))
  );
  return { ...data, icons, aliases };
}

const REGION_CODE = /^[a-z]{2}$/;
const regionNames = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }); }
  catch { return null; }
})();

/**
 * Codes the flag set still ships that CLDR resolves to their successor state,
 * which would label a flag as a country it never belonged to — `su` is the
 * Soviet flag, not Russia's — and would put two identical names in the grid.
 */
const HISTORIC = {
  an: 'Netherlands Antilles', cs: 'Serbia and Montenegro', fx: 'Metropolitan France',
  su: 'Soviet Union', yu: 'Yugoslavia'
};

function regionName(code) {
  if (HISTORIC[code]) return HISTORIC[code];
  try {
    const name = regionNames?.of(code.toUpperCase());
    return name && name.toUpperCase() !== code.toUpperCase() ? name : '';
  } catch { return ''; }
}

/**
 * What an icon is called in the grid, and the extra words it answers to.
 * Two sets need this: Circle Flags names icons by ISO region code, so nothing
 * there matches a search for "France", and Fluent Color suffixes every name
 * with the pixel size it was drawn at.
 */
export function describe(prefix, name) {
  const words = name.replace(/-/g, ' ');
  if (prefix === 'circle-flags') {
    const region = REGION_CODE.test(name) ? regionName(name) : '';
    return region ? { name: region, terms: `${name} flag` } : { name: words, terms: 'flag' };
  }
  if (prefix === 'fluent-color') return { name: words.replace(/ \d+$/, ''), terms: '' };
  return { name: words, terms: '' };
}
