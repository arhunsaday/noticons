import Fuse from 'fuse.js';
import { getIconData, iconToSVG, iconToHTML } from '@iconify/utils';
import { GROUP_IDS, describe, groupsOf } from './collections.js';

export const FEATURED = [
  // Brands and developer tools
  'logos:notion-icon', 'logos:github-icon', 'logos:figma', 'logos:react', 'logos:typescript-icon', 'logos:python',
  'logos:javascript', 'logos:nodejs-icon', 'logos:docker-icon', 'logos:google-icon', 'logos:slack-icon',
  'logos:aws', 'logos:vercel-icon', 'logos:tailwindcss-icon', 'logos:postgresql', 'logos:git-icon', 'logos:linear-icon',
  'logos:spotify-icon', 'logos:youtube-icon', 'devicon:vscode', 'devicon:kubernetes',
  'skill-icons:notion-light', 'skill-icons:github-dark', 'skill-icons:figma-light', 'skill-icons:react-dark',
  'skill-icons:python-dark', 'skill-icons:vscode-dark', 'skill-icons:golang', 'skill-icons:tailwindcss-dark',
  'skill-icons:linux-dark', 'skill-icons:postgresql-dark', 'skill-icons:aws-dark', 'skill-icons:nodejs-dark',
  'simple-icons:notion', 'simple-icons:linear', 'simple-icons:openai', 'simple-icons:obsidian',
  // Emoji
  'fluent-emoji-flat:rocket', 'fluent-emoji-flat:books', 'fluent-emoji-flat:seedling', 'fluent-emoji-flat:artist-palette',
  'fluent-emoji-flat:light-bulb', 'fluent-emoji-flat:laptop', 'fluent-emoji-flat:globe-showing-europe-africa',
  'fluent-emoji-flat:calendar', 'fluent-emoji-flat:memo', 'fluent-emoji-flat:bar-chart', 'fluent-emoji-flat:money-bag',
  'fluent-emoji-flat:briefcase', 'fluent-emoji-flat:brain', 'fluent-emoji-flat:sparkles', 'fluent-emoji-flat:fire',
  'fluent-emoji-flat:party-popper', 'fluent-emoji-flat:alarm-clock', 'fluent-emoji-flat:mobile-phone',
  'fluent-emoji-flat:camera', 'fluent-emoji-flat:headphone', 'fluent-emoji-flat:house', 'fluent-emoji-flat:world-map',
  'fluent-emoji-flat:chart-increasing', 'fluent-emoji-flat:locked', 'fluent-emoji-flat:key', 'fluent-emoji-flat:pushpin',
  'fluent-emoji-flat:paperclip', 'fluent-emoji-flat:package', 'fluent-emoji-flat:gear', 'fluent-emoji-flat:wrench',
  'fluent-emoji-flat:test-tube', 'fluent-emoji-flat:microscope', 'fluent-emoji-flat:graduation-cap',
  'fluent-emoji-flat:open-book', 'fluent-emoji-flat:pencil', 'fluent-emoji-flat:card-index-dividers',
  'fluent-emoji-flat:file-folder', 'fluent-emoji-flat:inbox-tray', 'fluent-emoji-flat:envelope', 'fluent-emoji-flat:telephone',
  'fluent-emoji-flat:handshake', 'fluent-emoji-flat:person-running', 'fluent-emoji-flat:green-apple',
  'fluent-emoji-flat:hot-beverage', 'fluent-emoji-flat:birthday-cake', 'fluent-emoji-flat:four-leaf-clover',
  'fluent-emoji-flat:sun', 'fluent-emoji-flat:crescent-moon', 'fluent-emoji-flat:star', 'fluent-emoji-flat:high-voltage',
  'fluent-emoji-flat:compass', 'fluent-emoji-flat:luggage', 'fluent-emoji-flat:airplane', 'fluent-emoji-flat:mountain',
  'fluent-emoji-flat:deciduous-tree', 'fluent-emoji-flat:potted-plant', 'fluent-emoji-flat:trophy', 'fluent-emoji-flat:bookmark-tabs',
  'twemoji:rocket', 'twemoji:light-bulb', 'twemoji:books', 'twemoji:artist-palette', 'twemoji:bullseye',
  'twemoji:chart-increasing', 'twemoji:party-popper', 'twemoji:brain', 'twemoji:crystal-ball', 'twemoji:sparkles',
  'twemoji:fire', 'twemoji:seedling', 'twemoji:money-bag', 'twemoji:briefcase', 'twemoji:memo', 'twemoji:calendar',
  'twemoji:file-folder', 'twemoji:card-index-dividers', 'twemoji:graduation-cap', 'twemoji:laptop', 'twemoji:gear',
  'twemoji:locked', 'twemoji:key', 'twemoji:pushpin', 'twemoji:handshake', 'twemoji:hot-beverage', 'twemoji:trophy',
  'twemoji:compass', 'twemoji:airplane', 'twemoji:mountain', 'twemoji:deciduous-tree', 'twemoji:sun', 'twemoji:star',
  'twemoji:high-voltage', 'twemoji:robot', 'twemoji:ghost', 'twemoji:unicorn', 'twemoji:dragon', 'twemoji:rainbow',
  'twemoji:four-leaf-clover', 'twemoji:cherry-blossom', 'twemoji:maple-leaf', 'twemoji:pizza', 'twemoji:birthday-cake',
  'twemoji:anchor', 'twemoji:castle', 'twemoji:office-building', 'twemoji:school', 'twemoji:dna', 'twemoji:microscope',
  'streamline-emojis:rocket', 'streamline-emojis:fire', 'streamline-emojis:artist-palette', 'streamline-emojis:calendar',
  'streamline-emojis:money-bag', 'streamline-emojis:graduation-cap', 'streamline-emojis:open-book',
  'streamline-emojis:crystal-ball-1', 'streamline-emojis:wrapped-gift-1', 'streamline-emojis:robot-face-1',
  'streamline-emojis:sunflower-1', 'streamline-emojis:birthday-cake-1', 'streamline-emojis:star-struck-1',
  'streamline-emojis:airplane', 'streamline-emojis:musical-note', 'streamline-emojis:ghost', 'streamline-emojis:rainbow',
  'streamline-emojis:anchor', 'streamline-emojis:alien', 'streamline-emojis:pizza-1',
  // Colour
  'flat-color-icons:folder', 'flat-color-icons:idea', 'flat-color-icons:calendar', 'flat-color-icons:todo-list',
  'flat-color-icons:statistics', 'flat-color-icons:business', 'flat-color-icons:database', 'flat-color-icons:settings',
  'flat-color-icons:library', 'flat-color-icons:home', 'flat-color-icons:about', 'flat-color-icons:package',
  'flat-color-icons:document', 'flat-color-icons:briefcase', 'flat-color-icons:currency-exchange', 'flat-color-icons:conference-call',
  // Fluent Color keeps only its largest variant of each icon, so these carry
  // the pixel size upstream drew it at; the suggested-icon test guards them.
  'fluent-color:lightbulb-48', 'fluent-color:calendar-48', 'fluent-color:notebook-32', 'fluent-color:people-team-48',
  'fluent-color:chart-multiple-32', 'fluent-color:briefcase-48', 'fluent-color:book-open-48', 'fluent-color:trophy-48',
  'fluent-color:shield-checkmark-48', 'fluent-color:database-48', 'fluent-color:code-24', 'fluent-color:bot-24',
  'fluent-color:clipboard-task-24', 'fluent-color:megaphone-loud-32', 'fluent-color:savings-32', 'fluent-color:globe-24',
  'fluent-color:design-ideas-48', 'fluent-color:puzzle-piece-48', 'fluent-color:toolbox-32', 'fluent-color:premium-32',
  'streamline-ultimate-color:award-trophy-1', 'streamline-ultimate-color:book-open-bookmark',
  'streamline-ultimate-color:calendar-1', 'streamline-ultimate-color:programming-book',
  'streamline-ultimate-color:shelf-books-1', 'streamline-ultimate-color:app-window-pie-chart',
  'streamline-ultimate-color:notes-book', 'streamline-ultimate-color:office-desk-1',
  'material-icon-theme:folder-docs-open', 'material-icon-theme:folder-api-open', 'material-icon-theme:markdown',
  'material-icon-theme:database', 'material-icon-theme:python', 'material-icon-theme:typescript',
  'catppuccin:folder-src-open', 'catppuccin:markdown', 'catppuccin:database', 'catppuccin:figma',
  'circle-flags:fr', 'circle-flags:us', 'circle-flags:gb', 'circle-flags:de', 'circle-flags:es', 'circle-flags:it',
  'circle-flags:jp', 'circle-flags:br', 'circle-flags:ca', 'circle-flags:in', 'circle-flags:eu',
  // Duotone
  'solar:rocket-bold-duotone', 'solar:lightbulb-bold-duotone', 'solar:notebook-bold-duotone',
  'solar:calendar-bold-duotone', 'solar:folder-bold-duotone', 'solar:case-bold-duotone', 'solar:target-bold-duotone',
  'solar:graph-up-bold-duotone', 'solar:medal-star-bold-duotone', 'solar:pallete-2-bold-duotone',
  'solar:magic-stick-3-bold-duotone', 'solar:cup-hot-bold-duotone', 'solar:shield-check-bold-duotone',
  'solar:database-bold-duotone', 'solar:cloud-bold-duotone', 'solar:code-bold-duotone', 'solar:global-bold-duotone',
  'solar:wallet-bold-duotone', 'solar:chat-round-bold-duotone', 'solar:map-bold-duotone', 'solar:fire-bold-duotone',
  'solar:leaf-bold-duotone', 'solar:atom-bold-duotone', 'solar:plain-bold-duotone',
  'duo-icons:rocket', 'duo-icons:palette', 'duo-icons:target', 'duo-icons:book', 'duo-icons:briefcase',
  'duo-icons:calendar', 'duo-icons:chart-pie', 'duo-icons:compass', 'duo-icons:confetti', 'duo-icons:award',
  'ph:rocket-launch-duotone', 'ph:lightbulb-duotone', 'ph:notebook-duotone', 'ph:plant-duotone',
  'ph:chart-line-up-duotone', 'ph:compass-duotone', 'ph:campfire-duotone', 'ph:mountains-duotone',
  // Line icons
  'lucide:sparkles', 'lucide:code', 'lucide:coffee', 'lucide:heart', 'lucide:target', 'lucide:music',
  'lucide:rocket', 'lucide:book-open', 'lucide:calendar', 'lucide:circle-check', 'lucide:layers', 'lucide:compass',
  'lucide:zap', 'lucide:flag', 'lucide:lightbulb', 'lucide:pen-tool', 'lucide:folder', 'lucide:users',
  'lucide:message-circle', 'lucide:bell', 'lucide:shield', 'lucide:star', 'lucide:map', 'lucide:clock',
  'lucide:camera', 'lucide:palette', 'lucide:terminal', 'lucide:database', 'lucide:cloud', 'lucide:globe',
  'lucide:leaf', 'lucide:flame', 'lucide:trophy', 'lucide:briefcase', 'lucide:graduation-cap', 'lucide:activity',
  'lucide:chart-bar', 'lucide:inbox', 'lucide:bookmark', 'lucide:link', 'lucide:lock', 'lucide:settings',
  'lucide:smile', 'lucide:sun', 'lucide:moon', 'lucide:house', 'tabler:planet', 'tabler:brain', 'tabler:bulb',
  'tabler:rocket', 'tabler:notebook', 'tabler:chart-line', 'tabler:building', 'ph:plant', 'ph:mountains',
  'ph:brain', 'ph:rocket-launch', 'ph:book-bookmark', 'ph:anchor', 'ph:campfire'
];
// Page icons get picked by theme, not by icon name: nobody searches "seedling"
// when the page is called Roadmap. These map the way people name pages onto the
// words the icon sets actually use.
const SYNONYMS = {
  coding: 'code terminal programming developer', development: 'code developer',
  todo: 'check checklist list task', tasks: 'check checklist list task',
  finance: 'money bank wallet currency dollar', travel: 'airplane globe map luggage',
  learning: 'book graduation school', design: 'palette brush pen figma',
  work: 'briefcase building laptop', fitness: 'dumbbell running gym',
  ai: 'robot brain sparkles', javascript: 'javascript js', database: 'database sql storage',
  notes: 'notebook note pencil', docs: 'file document book', settings: 'settings gear cog',
  roadmap: 'map route flag milestone', meeting: 'users calendar video presentation',
  team: 'users people group', okr: 'target flag trending chart',
  wiki: 'book library archive', inbox: 'inbox mail tray bell',
  budget: 'calculator receipt coins chart', hiring: 'user plus id badge briefcase',
  marketing: 'megaphone trending chart target', sales: 'handshake trending receipt',
  support: 'life buoy headset message', legal: 'scale gavel shield file',
  security: 'shield lock key fingerprint', release: 'rocket package tag git',
  bug: 'bug alert wrench', idea: 'light bulb sparkles brain',
  personal: 'home heart user coffee', health: 'heart pulse stethoscope leaf',
  recipe: 'chef utensils pot bowl', music: 'music headphones disc guitar',
  reading: 'book bookmark glasses', writing: 'pen feather typewriter file',
  archive: 'archive box folder', analytics: 'chart bar trending activity',
  api: 'plug webhook code braces', infra: 'server cloud database network',
  cloud: 'cloud server upload', mobile: 'smartphone device tablet',
  planning: 'calendar list map target', review: 'eye check clipboard star',
  country: 'flag', language: 'flag translate globe', region: 'flag map globe',
  emoji: 'face smile grinning', file: 'document page folder',
  onboarding: 'handshake graduation checklist door', retro: 'sticky note chat lightbulb'
};
export function normalizeQuery(query) {
  return String(query || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').slice(0, 100);
}
export function createCatalog(sets) {
  const entries = [];
  for (const [prefix, { data, info }] of Object.entries(sets)) {
    for (const name of Object.keys(data.icons)) {
      const { name: label, terms } = describe(prefix, name);
      entries.push({ id: `${prefix}:${name}`, prefix, name: label, terms, set: info.name, groups: groupsOf(prefix, name) });
    }
  }
  const fuse = new Fuse(entries, {
    keys: [{ name: 'name', weight: 3 }, { name: 'terms', weight: 1.2 }, { name: 'set', weight: 0.4 }],
    threshold: 0.32, ignoreLocation: true, includeScore: true
  });
  const byId = new Map(entries.map(e => [e.id, e]));
  function search({ query = '', group = 'all', prefix = '', offset = 0, limit = 96 } = {}) {
    const q = normalizeQuery(query);
    const wanted = GROUP_IDS.includes(group) ? group : 'all';
    const accepts = e => (!prefix || e.prefix === prefix) && (wanted === 'all' || e.groups.includes(wanted));
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
  /**
   * Saved and Recent are lists of ids with no search behind them. Rendering
   * them one message per icon meant 200 round trips through the worker, so
   * they are resolved in a single call. Unknown ids are dropped rather than
   * failing the batch: a set can disappear between extension versions.
   */
  function icons(ids, color) {
    const out = [];
    for (const id of Array.isArray(ids) ? ids.slice(0, 400) : []) {
      try { out.push({ id, svg: icon(id, color) }); } catch { /* stale id */ }
    }
    return out;
  }

  return {
    search, icon, icons,
    info: Object.fromEntries(Object.entries(sets).map(([p, s]) => [p, { ...s.info, count: Object.keys(s.data.icons).length }])),
    count: entries.length
  };
}
