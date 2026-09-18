import Fuse from 'fuse.js';
import { getIconData, iconToSVG, iconToHTML } from '@iconify/utils';

export const GROUPS = {
  all: [],
  simple: ['lucide', 'tabler', 'ph'],
  brands: ['simple-icons', 'logos', 'devicon'],
  colorful: ['fluent-emoji-flat', 'flat-color-icons', 'logos', 'devicon']
};
export const MONO = new Set(['lucide', 'tabler', 'ph', 'simple-icons']);
export const FEATURED = [
  'logos:notion-icon', 'logos:github-icon', 'logos:figma', 'logos:react', 'logos:typescript-icon', 'logos:python',
  'fluent-emoji-flat:rocket', 'fluent-emoji-flat:books', 'fluent-emoji-flat:seedling', 'fluent-emoji-flat:artist-palette',
  'fluent-emoji-flat:light-bulb', 'fluent-emoji-flat:laptop', 'fluent-emoji-flat:globe-showing-europe-africa',
  'flat-color-icons:folder', 'flat-color-icons:idea', 'flat-color-icons:calendar',
  'lucide:sparkles', 'lucide:code', 'lucide:coffee', 'lucide:heart', 'lucide:target', 'lucide:music',
  'tabler:planet', 'tabler:brain', 'ph:plant', 'ph:mountains'
];
const SYNONYMS = {
  coding: 'code terminal programming developer', development: 'code developer',
  todo: 'check checklist list task', tasks: 'check checklist list task',
  finance: 'money bank wallet currency dollar', travel: 'airplane globe map luggage',
  learning: 'book graduation school', design: 'palette brush pen figma',
  work: 'briefcase building laptop', fitness: 'dumbbell running gym',
  ai: 'robot brain sparkles', javascript: 'javascript js', database: 'database sql storage',
  notes: 'notebook note pencil', docs: 'file document book', settings: 'settings gear cog'
};
export function normalizeQuery(query) {
  return String(query || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').slice(0, 100);
}
export function createCatalog(sets) {
  const entries = [];
  for (const [prefix, { data, info }] of Object.entries(sets)) {
    for (const name of Object.keys(data.icons)) {
      entries.push({ id: `${prefix}:${name}`, prefix, name: name.replace(/-/g, ' '), set: info.name });
    }
  }
  const fuse = new Fuse(entries, { keys: [{ name: 'name', weight: 3 }, { name: 'set', weight: 0.4 }], threshold: 0.32, ignoreLocation: true, includeScore: true });
  const byId = new Map(entries.map(e => [e.id, e]));
  function search({ query = '', group = 'all', prefix = '', offset = 0, limit = 96 } = {}) {
    const q = normalizeQuery(query);
    const allowed = GROUPS[group] || [];
    const accepts = e => (!prefix || e.prefix === prefix) && (!allowed.length || allowed.includes(e.prefix));
    let ranked;
    if (q) {
      const terms = [...new Set([q, ...(SYNONYMS[q] || '').split(' ').filter(Boolean)])];
      const scores = new Map();
      terms.forEach((term, index) => {
        for (const { item, score } of fuse.search(term)) {
          const adjusted = score + (index ? 0.16 : 0) + Math.min(0.12, Math.abs(item.name.length - term.length) * 0.008);
          if (!scores.has(item.id) || adjusted < scores.get(item.id).score) scores.set(item.id, { item, score: adjusted });
        }
      });
      ranked = [...scores.values()].sort((a, b) => a.score - b.score || a.item.id.localeCompare(b.item.id)).map(r => r.item).filter(accepts);
    } else {
      const featured = FEATURED.map(id => byId.get(id)).filter(e => e && accepts(e));
      const seen = new Set(featured.map(e => e.id));
      ranked = [...featured, ...entries.filter(e => accepts(e) && !seen.has(e.id))];
    }
    return { items: ranked.slice(offset, offset + limit), total: ranked.length, offset };
  }
  function icon(id, color = '#37352f') {
    const [prefix, name] = String(id).split(':');
    const set = sets[prefix];
    if (!set || !/^[a-z0-9-]+$/.test(name)) throw new Error('Unknown icon');
    const data = getIconData(set.data, name);
    if (!data) throw new Error('Unknown icon');
    const built = iconToSVG(data, { width: 96, height: 96 });
    const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#37352f';
    return iconToHTML(built.body.replaceAll('currentColor', safeColor), built.attributes);
  }
  return {
    search, icon,
    info: Object.fromEntries(Object.entries(sets).map(([p, s]) => [p, { ...s.info, count: Object.keys(s.data.icons).length }])),
    count: entries.length
  };
}
