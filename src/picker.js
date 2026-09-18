import styles from './styles.js';
import { MONO } from './catalog.js';
import { svgToPng, uploadToNotion } from './notion.js';
import { extensionApi as api } from './api.js';

export async function request(message) {
  const response = await api.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || 'Extension was updated. Refresh this Notion page.');
  return response.data;
}
export function safeSvg(svg) {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (parsed.documentElement.localName !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Invalid icon image');
  parsed.querySelectorAll('script, foreignObject, iframe, style, image, animate, set').forEach(e => e.remove());
  for (const e of [parsed.documentElement, ...parsed.querySelectorAll('*')]) {
    for (const attr of [...e.attributes]) {
      if (/^on/i.test(attr.name) || /^(href|xlink:href)$/i.test(attr.name) && !attr.value.startsWith('#')) e.removeAttribute(attr.name);
    }
  }
  const element = document.importNode(parsed.documentElement, true);
  element.setAttribute('aria-hidden', 'true');
  return element;
}
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (className, text, onClick) => {
  const b = el('button', className, text); b.type = 'button'; b.addEventListener('click', onClick); return b;
};
export function openPicker({ popup, onClose }) {
  const host = el('div');
  host.dataset.notionIconsPlus = 'panel';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = el('style'); style.textContent = styles; shadow.append(style);
  const panel = el('section', 'panel');
  const integrated = Boolean(popup);
  panel.dataset.integrated = String(integrated);
  const dark = integrated ? Boolean(document.querySelector('.notion-dark-theme')) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  panel.dataset.theme = dark ? 'dark' : 'light';
  panel.setAttribute('role', integrated ? 'region' : 'dialog'); panel.setAttribute('aria-label', 'More icons');
  if (!integrated) panel.setAttribute('aria-modal', 'true');
  shadow.append(panel);
  let closed = false, version = 0, selectionVersion = 0, timer, current, allInfo = {}, busy = false;
  let state = { query: '', group: 'all', prefix: '', color: dark ? '#ffffff' : '#37352f', offset: 0, total: 0 };
  let favorites = [], recent = [];
  const tiles = new Map();
  const restoreFocus = document.activeElement;
  function close() {
    if (closed) return;
    closed = true; version++; selectionVersion++; clearTimeout(timer);
    host.remove(); window.removeEventListener('resize', position); document.removeEventListener('pointerdown', outside, true);
    restoreFocus?.focus?.(); onClose?.();
  }
  function position() {
    const r = popup?.root.getBoundingClientRect();
    const tabs = popup?.tabs.getBoundingClientRect();
    const width = Math.min(r ? r.width - 2 : 420, window.innerWidth - 24);
    const top = tabs ? tabs.bottom + 1 : Math.max(12, Math.min(80, window.innerHeight - 480));
    const height = Math.max(160, Math.min(r ? Math.max(360, r.bottom - top - 1) : 460, window.innerHeight - top - 12));
    host.style.setProperty('--picker-width', `${width}px`);
    host.style.setProperty('--picker-height', `${height}px`);
    host.style.left = `${Math.max(12, Math.min(r ? r.left + 1 : (window.innerWidth - width) / 2, window.innerWidth - width - 12))}px`;
    host.style.top = `${top}px`;
  }
  function outside(e) {
    if (e.composedPath().includes(host)) return;
    if (popup?.tabs.contains(e.target) && e.target.closest('[data-notion-icons-plus="tab"]')) return;
    close();
  }
  window.addEventListener('resize', position); document.addEventListener('pointerdown', outside, true);
  host.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key === 'Tab' && !integrated) {
      const controls = [...shadow.querySelectorAll('button:not(:disabled), input, select, a[href]')].filter(e => e.getClientRects().length);
      const active = shadow.activeElement;
      if (e.shiftKey && active === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && active === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    }
  });
  if (!integrated) {
    const top = el('header', 'top'); top.append(el('span', 'title', 'More icons'));
    const x = button('close', '×', close); x.setAttribute('aria-label', 'Close icon library'); top.append(x); panel.append(top);
  }
  const searchWrap = el('div', 'search-wrap'); searchWrap.append(el('span', '', '⌕'));
  const search = el('input', 'search'); search.type = 'search'; search.placeholder = 'Filter icons…'; search.setAttribute('aria-label', 'Search all icons');
  searchWrap.append(search); panel.append(searchWrap);
  const categories = el('nav', 'categories'); categories.setAttribute('aria-label', 'Icon categories');
  const categoryButtons = [];
  for (const [id, title] of [['all', 'All'], ['brands', 'Brands'], ['colorful', 'Color'], ['simple', 'Simple'], ['favorites', 'Saved'], ['recent', 'Recent']]) {
    const b = button('category', title, () => { state.group = id; state.prefix = ''; setSelect.value = ''; updateCategories(); load(); });
    b.dataset.group = id; b.setAttribute('aria-pressed', String(id === state.group)); categoryButtons.push(b); categories.append(b);
  }
  function updateCategories() { categoryButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.group === state.group))); }
  panel.append(categories);
  const toolbar = el('div', 'toolbar');
  const setSelect = el('select', 'set-select'); setSelect.setAttribute('aria-label', 'Filter icon collection'); setSelect.append(new Option('All collections', '')); toolbar.append(setSelect);
  setSelect.addEventListener('change', () => { state.prefix = setSelect.value; load(); });
  const colors = el('div', 'colors'); colors.setAttribute('aria-label', 'Monochrome icon colors');
  for (const color of ['#37352f', '#ffffff', '#6b876b', '#d29351', '#688ec1', '#bd6b74']) {
    const b = button('swatch', '', () => changeColor(color)); b.style.background = color; b.dataset.color = color; b.setAttribute('aria-label', `Use ${color} for monochrome icons`); b.setAttribute('aria-pressed', String(state.color === color)); colors.append(b);
  }
  const customColor = el('input', 'color-input'); customColor.type = 'color'; customColor.value = state.color; customColor.setAttribute('aria-label', 'Custom monochrome icon color'); customColor.addEventListener('input', () => changeColor(customColor.value)); colors.append(customColor); toolbar.append(colors); panel.append(toolbar);
  async function changeColor(color) {
    state.color = color; customColor.value = color;
    colors.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === color)));
    const selected = current;
    load();
    if (selected) await select(selected, false);
  }
  const results = el('div', 'results');
  const section = el('div', 'section-title'); const sectionName = el('span', '', 'Icons'); const count = el('span', '', 'Loading…'); section.append(sectionName, count);
  const grid = el('div', 'grid'); grid.setAttribute('aria-label', 'Icon search results');
  const more = button('load-more', 'Show more icons', () => load(true)); more.hidden = true;
  results.append(section, grid, more); panel.append(results);
  grid.addEventListener('keydown', e => {
    const buttons = [...grid.querySelectorAll('button')]; const index = buttons.indexOf(shadow.activeElement);
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[e.key];
    if (index >= 0 && delta) { e.preventDefault(); buttons[Math.max(0, Math.min(buttons.length - 1, index + delta))]?.focus(); }
  });
  const detail = el('div', 'detail'); detail.hidden = true; panel.append(detail);
  const status = el('div', 'status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); panel.append(status);
  function message(text, error = false) { if (closed) return; status.textContent = text; status.dataset.error = String(error); }
  function renderItems(items, append = false) {
    if (!append) { grid.replaceChildren(); tiles.clear(); }
    for (const item of items) {
      if (tiles.has(item.id)) continue;
      const b = button('tile', '', () => select(item)); b.title = `${item.name} · ${item.set}`; b.setAttribute('aria-label', b.title); b.setAttribute('aria-pressed', String(current?.id === item.id)); b.dataset.iconId = item.id;
      b.title += '\nRight-click to save or download';
      b.addEventListener('contextmenu', e => { e.preventDefault(); select(item, false); });
      b.dataset.originalColors = String(!MONO.has(item.prefix));
      try { b.append(safeSvg(item.svg)); } catch { continue; }
      if (favorites.includes(item.id)) b.append(el('span', 'star', '●'));
      grid.append(b); tiles.set(item.id, b);
    }
    if (!items.length && !append) grid.append(el('div', 'empty', state.group === 'favorites' ? 'Save your favorites with the heart button.' : state.group === 'recent' ? 'Icons you apply or download will appear here.' : 'No icons found. Try a shorter word or another collection.'));
    grid.querySelector('.empty')?.style.setProperty('grid-column', '1 / -1');
  }
  async function load(append = false) {
    const token = ++version;
    if (!append) { state.offset = 0; results.scrollTop = 0; }
    grid.setAttribute('aria-busy', 'true'); more.disabled = true;
    try {
      let data;
      if (['favorites', 'recent'].includes(state.group)) {
        const ids = (state.group === 'favorites' ? favorites : recent).filter(id => (!state.prefix || id.startsWith(state.prefix + ':')) && (!state.query || id.replaceAll('-', ' ').includes(state.query.toLowerCase())));
        const items = await Promise.all(ids.map(async id => {
          const [prefix, name] = id.split(':');
          const { svg } = await request({ type: 'icon', id, color: state.color });
          return { id, prefix, name: name.replaceAll('-', ' '), set: allInfo[prefix]?.name || prefix, svg };
        }));
        data = { items, total: items.length };
      } else data = await request({ type: 'search', ...state });
      if (closed || token !== version) return;
      state.total = data.total; state.offset += data.items.length;
      renderItems(data.items, append);
      count.textContent = `${data.total.toLocaleString()} icons`;
      sectionName.textContent = state.query ? 'Results' : state.group === 'favorites' ? 'Saved' : state.group === 'recent' ? 'Recent' : 'Icons';
      more.hidden = state.offset >= data.total || ['favorites', 'recent'].includes(state.group);
    } catch (e) { if (token === version) message(e.message, true); }
    finally { if (token === version) { grid.setAttribute('aria-busy', 'false'); more.disabled = false; } }
  }
  async function persist() { await api.storage.local.set({ favorites, recent }); }
  async function used(id) { recent = [id, ...recent.filter(x => x !== id)].slice(0, 40); await persist(); }
  async function select(item, applyOnClick = true) {
    if (busy) return;
    const token = ++selectionVersion;
    try {
      const { svg } = await request({ type: 'icon', id: item.id, color: state.color });
      if (closed || token !== selectionVersion) return;
      current = { ...item, svg }; message('');
      tiles.forEach((b, id) => b.setAttribute('aria-pressed', String(id === item.id)));
      detail.hidden = false; detail.replaceChildren();
      const preview = el('div', 'preview'); preview.dataset.originalColors = String(!MONO.has(item.prefix)); preview.append(safeSvg(svg));
      const info = el('div', 'info'); info.append(el('div', 'name', item.name));
      const meta = allInfo[item.prefix]; const license = el('a', 'license', item.set);
      license.title = `${meta?.license?.title || 'View license'}${MONO.has(item.prefix) ? '' : ' · Original colors'}`;
      const href = meta?.license?.url || `https://icon-sets.iconify.design/${item.prefix}/`;
      if (/^https:\/\//.test(href)) { license.href = href; license.target = '_blank'; license.rel = 'noopener noreferrer'; }
      info.append(license);
      const saved = button('favorite', favorites.includes(item.id) ? '♥' : '♡', async () => {
        favorites = favorites.includes(item.id) ? favorites.filter(id => id !== item.id) : [item.id, ...favorites].slice(0, 200);
        saved.textContent = favorites.includes(item.id) ? '♥' : '♡'; saved.setAttribute('aria-pressed', String(favorites.includes(item.id)));
        try { await persist(); if (state.group === 'favorites') load(); } catch (e) { message(e.message, true); }
      }); saved.setAttribute('aria-label', 'Save favorite icon'); saved.setAttribute('aria-pressed', String(favorites.includes(item.id)));
      const download = button('download', '↓ PNG', async () => {
        try {
          download.disabled = true;
          const file = await svgToPng(svg, item.id);
          const url = URL.createObjectURL(file); const a = el('a'); a.href = url; a.download = file.name; shadow.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
          await used(item.id); message('PNG downloaded. You can upload it in Notion’s custom image tab.');
        } catch (e) { message(e.message, true); } finally { download.disabled = false; }
      }); download.setAttribute('aria-label', 'Download icon as PNG');
      detail.append(preview, info, saved, download);
      // Like Notion's built-in Icons tab: choose ink first, then click once.
      // Keep selection details only for recoloring / recovery after a failed upload.
      if (applyOnClick) {
        busy = true; detail.hidden = true;
        tiles.forEach(b => { b.disabled = true; });
        try {
          message('Applying icon…');
          const file = await svgToPng(svg, item.id);
          await uploadToNotion(file, popup); await used(item.id);
          close();
        } catch (e) { detail.hidden = false; message(e.message, true); }
        finally { busy = false; tiles.forEach(b => { b.disabled = false; }); }
      }
    } catch (e) { message(e.message, true); }
  }
  search.addEventListener('input', () => { state.query = search.value; clearTimeout(timer); version++; timer = setTimeout(() => load(), 150); });
  (popup?.root || document.body).append(host); position(); search.focus();
  (async () => {
    try {
      const [data, stored] = await Promise.all([request({ type: 'info' }), api.storage.local.get(['favorites', 'recent'])]);
      if (closed) return;
      allInfo = data.sets;
      const valid = id => typeof id === 'string' && /^[a-z0-9-]+:[a-z0-9-]+$/.test(id) && allInfo[id.split(':')[0]];
      favorites = Array.isArray(stored.favorites) ? stored.favorites.filter(valid).slice(0, 200) : [];
      recent = Array.isArray(stored.recent) ? stored.recent.filter(valid).slice(0, 40) : [];
      search.title = `${data.count.toLocaleString()} icons across ${Object.keys(allInfo).length} collections`;
      for (const [prefix, meta] of Object.entries(allInfo)) setSelect.append(new Option(`${meta.name} (${meta.count.toLocaleString()})`, prefix));
      load();
    } catch (e) { message(e.message, true); }
  })();
  return { close, host };
}
