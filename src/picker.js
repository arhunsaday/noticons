import styles from './styles.js';
import { TINTABLE, describe } from './collections.js';
import { glyph } from './glyphs.js';
import { INK_COLORS, defaultInk, inkName } from './theme.js';
import { svgToPng, uploadToNotion } from './notion.js';
import { extensionApi as api } from './api.js';

const PREFS = 'prefs';
const SKELETONS = 48;
const APPLIED_MS = 520;

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

export const isHex = value => /^#[0-9a-f]{6}$/i.test(String(value));

const COLOR_IN_SVG = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi;

function relativeLuminance(hex) {
  const h = hex.slice(1);
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A dark-on-transparent logo — GitHub's mark, most wordmarks — disappears into
 * Notion's dark surface, so it gets a light plate behind it. Plating *every*
 * full-colour icon, which is the easy version of this, turns the grid into a
 * wall of white cards; only icons with no light colour at all need one.
 */
export function needsPlate(svg) {
  const colors = String(svg).match(COLOR_IN_SVG);
  if (!colors) return false;
  return colors.every(color => relativeLuminance(color) < 0.35);
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const button = (className, onClick, label) => {
  const b = el('button', className);
  b.type = 'button';
  if (label) { b.title = label; b.setAttribute('aria-label', label); }
  if (onClick) b.addEventListener('click', onClick);
  return b;
};

const CATEGORIES = [
  ['all', 'All', 'grid'],
  ['color', 'Colour', 'droplet'],
  ['emoji', 'Emoji', 'smile'],
  ['brands', 'Brands', 'tag'],
  ['duotone', 'Duotone', 'contrast'],
  ['simple', 'Simple', 'pen'],
  ['favorites', 'Saved', 'heart'],
  ['recent', 'Recent', 'clock']
];

export function openPicker({ popup, onClose }) {
  const host = el('div');
  host.dataset.noticon = 'panel';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = el('style');
  style.textContent = styles;
  shadow.append(style);

  const panel = el('section', 'panel');
  const integrated = Boolean(popup);
  panel.dataset.integrated = String(integrated);
  const isDark = () => integrated
    ? Boolean(document.querySelector('.notion-dark-theme'))
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  let dark = isDark();
  panel.dataset.theme = dark ? 'dark' : 'light';
  panel.setAttribute('role', integrated ? 'region' : 'dialog');
  panel.setAttribute('aria-label', 'Noticon icon library');
  if (!integrated) panel.setAttribute('aria-modal', 'true');
  shadow.append(panel);

  let closed = false, version = 0, selectionVersion = 0, timer, appliedTimer;
  let current, allInfo = {}, busy = false, loading = false;
  let favorites = [], recent = [], ready = false, detailFavorite;
  const state = { query: '', group: 'all', prefix: '', color: defaultInk(dark), offset: 0, total: 0 };
  const tiles = new Map();
  const restoreFocus = document.activeElement;

  /* ── lifecycle ─────────────────────────────────────────────────────── */

  function close() {
    if (closed) return;
    closed = true;
    version++; selectionVersion++;
    clearTimeout(timer); clearTimeout(appliedTimer);
    sentinelWatcher?.disconnect(); themeWatcher?.disconnect();
    host.remove();
    window.removeEventListener('resize', position);
    document.removeEventListener('pointerdown', outside, true);
    restoreFocus?.focus?.();
    onClose?.();
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
    if (popup?.tabs.contains(e.target) && e.target.closest('[data-noticon="tab"]')) return;
    close();
  }

  window.addEventListener('resize', position);
  document.addEventListener('pointerdown', outside, true);

  // Notion's theme toggle is live, so the panel follows it instead of keeping
  // whichever colour scheme happened to be on when it opened.
  const themeWatcher = integrated ? new MutationObserver(() => {
    const next = isDark();
    if (next === dark) return;
    const wasDefault = state.color.toLowerCase() === defaultInk(dark).toLowerCase();
    dark = next;
    panel.dataset.theme = dark ? 'dark' : 'light';
    renderSwatches();
    if (wasDefault) setColor(defaultInk(dark), { reload: true });
  }) : null;
  themeWatcher?.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  host.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (!inkPop.hidden) { closeInk(); search.focus(); return; }
      close();
      return;
    }
    if (e.key === 'Tab' && !integrated) {
      const controls = [...shadow.querySelectorAll('button:not(:disabled), input, select, a[href]')]
        .filter(node => node.getClientRects().length && node.tabIndex !== -1);
      const active = shadow.activeElement;
      if (e.shiftKey && active === controls[0]) { e.preventDefault(); controls.at(-1)?.focus(); }
      else if (!e.shiftKey && active === controls.at(-1)) { e.preventDefault(); controls[0]?.focus(); }
    }
  });

  /* ── header (standalone only) ──────────────────────────────────────── */

  if (!integrated) {
    const top = el('header', 'top');
    const brand = el('div', 'brand');
    brand.append(glyph('sparkle'), el('span', '', 'Noticon'));
    const x = button('close', close, 'Close icon library');
    x.append(glyph('close'));
    top.append(brand, x);
    panel.append(top);
  }

  /* ── search ────────────────────────────────────────────────────────── */

  const searchRow = el('div', 'search-row');
  const searchWrap = el('div', 'search-wrap');
  const search = el('input', 'search');
  search.type = 'search';
  search.placeholder = 'Filter icons…';
  search.autocomplete = 'off';
  search.spellcheck = false;
  search.setAttribute('aria-label', 'Search the icon library');
  const clear = button('clear', () => { search.value = ''; onQuery(); search.focus(); }, 'Clear search');
  clear.append(glyph('close'));
  clear.hidden = true;
  searchWrap.append(glyph('search'), search, clear);
  searchRow.append(searchWrap);

  /* ── colour well ───────────────────────────────────────────────────── */

  const ink = el('div', 'ink');
  const inkTrigger = button('ink-trigger', () => (inkPop.hidden ? openInk() : closeInk()));
  inkTrigger.setAttribute('aria-haspopup', 'true');
  inkTrigger.setAttribute('aria-expanded', 'false');
  const inkDot = el('i', 'ink-dot');
  inkTrigger.append(inkDot);

  const inkPop = el('div', 'ink-pop');
  inkPop.hidden = true;
  inkPop.setAttribute('role', 'group');
  inkPop.setAttribute('aria-label', 'Icon colour');
  inkPop.append(el('div', 'ink-pop-title', 'Line and duotone colour'));
  const swatches = el('div', 'swatches');
  inkPop.append(swatches);

  const customRow = el('div', 'custom-row');
  const hex = el('input', 'hex');
  hex.type = 'text';
  hex.maxLength = 7;
  hex.spellcheck = false;
  hex.setAttribute('aria-label', 'Custom colour, as a hex code');
  const well = el('input', 'well');
  well.type = 'color';
  well.setAttribute('aria-label', 'Pick a custom colour');
  customRow.append(el('label', '', 'Custom'), hex, well);
  inkPop.append(customRow);
  ink.append(inkTrigger, inkPop);
  searchRow.append(ink);
  panel.append(searchRow);

  const swatchButtons = [];

  function renderSwatches() {
    swatches.replaceChildren();
    swatchButtons.length = 0;
    for (const entry of INK_COLORS) {
      const value = dark ? entry.dark : entry.light;
      const b = button('swatch', () => { setColor(value, { reload: true }); closeInk(); inkTrigger.focus(); }, entry.name);
      const dot = el('i');
      dot.style.background = value;
      b.dataset.color = value.toLowerCase();
      b.append(dot);
      swatchButtons.push(b);
      swatches.append(b);
    }
    syncColorUi();
  }

  function syncColorUi() {
    inkDot.style.background = state.color;
    const label = inkName(state.color, dark);
    inkTrigger.title = `Icon colour: ${label}`;
    inkTrigger.setAttribute('aria-label', `Icon colour: ${label}. Applies to monochrome icons.`);
    for (const b of swatchButtons) b.setAttribute('aria-pressed', String(b.dataset.color === state.color.toLowerCase()));
    if (shadow.activeElement !== hex) hex.value = state.color.toUpperCase();
    hex.removeAttribute('aria-invalid');
    well.value = state.color;
  }

  function openInk() {
    inkPop.hidden = false;
    inkTrigger.setAttribute('aria-expanded', 'true');
    swatchButtons.find(b => b.getAttribute('aria-pressed') === 'true')?.focus();
  }

  function closeInk() {
    inkPop.hidden = true;
    inkTrigger.setAttribute('aria-expanded', 'false');
  }

  shadow.addEventListener('pointerdown', e => {
    if (!inkPop.hidden && !e.composedPath().includes(ink)) closeInk();
  }, true);

  hex.addEventListener('input', () => {
    const value = hex.value.startsWith('#') ? hex.value : `#${hex.value}`;
    if (!isHex(value)) { hex.setAttribute('aria-invalid', 'true'); return; }
    setColor(value, { reload: true });
  });
  well.addEventListener('input', () => setColor(well.value, { reload: true }));

  /** One funnel for colour: repaints the grid and any open preview together. */
  function setColor(value, { reload = false } = {}) {
    if (!isHex(value)) return;
    state.color = value;
    syncColorUi();
    savePrefs();
    if (!reload || !ready) return;
    const selected = current;
    load();
    if (selected) preview(selected);
  }

  /* ── categories ────────────────────────────────────────────────────── */

  const categories = el('nav', 'categories');
  categories.setAttribute('aria-label', 'Icon categories');
  const categoryButtons = [];
  for (const [id, title, icon] of CATEGORIES) {
    const b = button('category', () => {
      if (state.group === id) return;
      state.group = id;
      state.prefix = '';
      setSelect.value = '';
      syncCategories();
      savePrefs();
      load();
    });
    b.dataset.group = id;
    b.append(glyph(icon), el('span', '', title));
    categoryButtons.push(b);
    categories.append(b);
  }

  function syncCategories() {
    for (const b of categoryButtons) b.setAttribute('aria-pressed', String(b.dataset.group === state.group));
  }
  syncCategories();
  panel.append(categories);

  /* ── collection + count ────────────────────────────────────────────── */

  const meta = el('div', 'meta');
  const setSelect = el('select', 'set-select');
  setSelect.setAttribute('aria-label', 'Filter by icon collection');
  setSelect.append(new Option('All collections', ''));
  setSelect.addEventListener('change', () => { state.prefix = setSelect.value; savePrefs(); load(); });
  const count = el('span', 'count', '');
  meta.append(setSelect, count);
  panel.append(meta);

  /* ── results ───────────────────────────────────────────────────────── */

  const results = el('div', 'results');
  const section = el('div', 'section', 'Suggested');
  const grid = el('div', 'grid');
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Icon results');
  const sentinel = el('div', 'sentinel');
  const more = button('load-more', () => load(true));
  more.textContent = 'Show more icons';
  more.hidden = true;
  results.append(section, grid, sentinel, more);
  panel.append(results);

  // Pages load as the grid is scrolled. The button stays as the keyboard route
  // and as the fallback where the observer never fires.
  const sentinelWatcher = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !more.hidden && !loading) load(true);
    }, { root: results, rootMargin: '240px' })
    : null;
  sentinelWatcher?.observe(sentinel);

  grid.addEventListener('keydown', e => {
    const all = [...grid.querySelectorAll('.tile')];
    const index = all.indexOf(shadow.activeElement?.closest?.('.tile'));
    if (index < 0) return;
    const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[e.key];
    if (delta) {
      e.preventDefault();
      const next = index + delta;
      if (next < 0) { search.focus(); return; }
      focusTile(Math.min(all.length - 1, next));
      return;
    }
    if (e.key === 'Home') { e.preventDefault(); focusTile(0); }
    if (e.key === 'End') { e.preventDefault(); focusTile(all.length - 1); }
  });

  /** Roving tabindex: the grid is one tab stop, arrows move within it. */
  function focusTile(index) {
    const all = [...grid.querySelectorAll('.tile')];
    all.forEach((tile, i) => { tile.tabIndex = i === index ? 0 : -1; });
    all[index]?.focus();
  }

  /* ── detail + status ───────────────────────────────────────────────── */

  const detail = el('div', 'detail');
  detail.hidden = true;
  panel.append(detail);

  const status = el('div', 'status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  panel.append(status);

  function message(text, { error = false, retry } = {}) {
    if (closed) return;
    status.replaceChildren();
    status.dataset.error = String(error);
    status.dataset.empty = String(!text);
    if (!text) return;
    if (error) status.append(glyph('alert'));
    status.append(el('span', '', text));
    if (retry) {
      const again = button('', retry);
      again.textContent = 'Retry';
      status.append(again);
    }
  }

  /* ── rendering ─────────────────────────────────────────────────────── */

  function showSkeletons() {
    grid.replaceChildren();
    tiles.clear();
    for (let i = 0; i < SKELETONS; i++) grid.append(el('div', 'skeleton'));
    grid.setAttribute('aria-busy', 'true');
  }

  function syncPin(pin, on) {
    pin.dataset.on = String(on);
    pin.title = on ? 'Remove from Saved' : 'Save to Saved';
    pin.setAttribute('aria-label', pin.title);
    pin.setAttribute('aria-pressed', String(on));
  }

  function makeTile(item) {
    const tile = button('tile', () => apply(item));
    tile.dataset.iconId = item.id;
    tile.dataset.plate = String(!TINTABLE.has(item.prefix) && needsPlate(item.svg));
    tile.tabIndex = -1;
    tile.setAttribute('aria-pressed', String(current?.id === item.id));
    tile.title = `${item.name} · ${item.set}\nClick to apply · Right-click to preview`;
    tile.setAttribute('aria-label', `${item.name}, ${item.set}`);
    tile.addEventListener('contextmenu', e => { e.preventDefault(); preview(item); });
    try { tile.append(safeSvg(item.svg)); } catch { return null; }

    const pin = button('pin', e => { e.stopPropagation(); toggleFavorite(item.id); });
    pin.tabIndex = -1;
    pin.append(glyph('bookmark'));
    syncPin(pin, favorites.includes(item.id));
    tile.append(pin);
    return tile;
  }

  function renderItems(items, append = false) {
    if (!append) { grid.replaceChildren(); tiles.clear(); }
    for (const item of items) {
      if (tiles.has(item.id)) continue;
      const tile = makeTile(item);
      if (!tile) continue;
      grid.append(tile);
      tiles.set(item.id, tile);
    }
    grid.setAttribute('aria-busy', 'false');
    if (!tiles.size) grid.append(emptyState());
    else if (!grid.querySelector('.tile[tabindex="0"]')) grid.querySelector('.tile').tabIndex = 0;
  }

  function emptyState() {
    const box = el('div', 'empty');
    if (state.group === 'favorites') {
      box.append(el('strong', '', 'Nothing saved yet'), el('span', '', 'Hover an icon and use the bookmark to keep it here.'));
      return box;
    }
    if (state.group === 'recent') {
      box.append(el('strong', '', 'No recent icons'), el('span', '', 'Icons you apply or download show up here.'));
      return box;
    }
    box.append(el('strong', '', 'No icons match'), el('span', '', 'Try a shorter word, or widen the filters.'));
    if (state.query || state.prefix || state.group !== 'all') {
      const reset = button('', () => {
        search.value = ''; clear.hidden = true;
        state.query = ''; state.prefix = ''; state.group = 'all';
        setSelect.value = '';
        syncCategories(); savePrefs(); load();
      });
      reset.textContent = 'Reset filters';
      box.append(el('br'), reset);
    }
    return box;
  }

  async function load(append = false) {
    const token = ++version;
    loading = true;
    if (!append) { state.offset = 0; results.scrollTop = 0; showSkeletons(); }
    more.disabled = true;
    try {
      const data = ['favorites', 'recent'].includes(state.group)
        ? await loadPinned()
        : await request({ type: 'search', ...state });
      if (closed || token !== version) return;
      state.total = data.total;
      state.offset += data.items.length;
      renderItems(data.items, append);
      count.textContent = data.total ? `${data.total.toLocaleString()} icon${data.total === 1 ? '' : 's'}` : '';
      section.textContent = state.query
        ? `Results for “${state.query.slice(0, 36)}”`
        : { favorites: 'Saved', recent: 'Recent' }[state.group] || 'Suggested';
      more.hidden = state.offset >= data.total;
      if (status.dataset.error === 'true') message('');
    } catch (e) {
      if (token !== version) return;
      grid.replaceChildren();
      grid.setAttribute('aria-busy', 'false');
      message(e.message, { error: true, retry: () => load(append) });
    } finally {
      if (token === version) { loading = false; more.disabled = false; }
    }
  }

  /** Saved and Recent are id lists, so their SVGs come back in one round trip. */
  async function loadPinned() {
    const source = state.group === 'favorites' ? favorites : recent;
    const ids = source.filter(id =>
      (!state.prefix || id.startsWith(`${state.prefix}:`)) &&
      (!state.query || id.replaceAll('-', ' ').includes(state.query.toLowerCase())));
    if (!ids.length) return { items: [], total: 0 };
    const { icons } = await request({ type: 'icons', ids, color: state.color });
    const items = icons.map(({ id, svg }) => {
      const [prefix, name] = id.split(':');
      return { id, prefix, ...describe(prefix, name), set: allInfo[prefix]?.name || prefix, svg };
    });
    return { items, total: items.length };
  }

  /* ── stored state ──────────────────────────────────────────────────── */

  async function persist() {
    try { await api.storage.local.set({ favorites, recent }); }
    catch (e) { message(e.message, { error: true }); }
  }

  function savePrefs() {
    if (!ready) return;
    Promise.resolve(api.storage.local.set({
      [PREFS]: { color: state.color, group: state.group, prefix: state.prefix }
    })).catch(() => undefined);
  }

  async function used(id) {
    recent = [id, ...recent.filter(x => x !== id)].slice(0, 40);
    await persist();
  }

  async function toggleFavorite(id) {
    favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [id, ...favorites].slice(0, 200);
    const on = favorites.includes(id);
    const pin = tiles.get(id)?.querySelector('.pin');
    if (pin) syncPin(pin, on);
    detailFavorite?.(on);
    await persist();
    if (state.group === 'favorites') load();
  }

  /* ── preview + apply ───────────────────────────────────────────────── */

  async function preview(item) {
    const token = ++selectionVersion;
    try {
      const svg = item.svg || (await request({ type: 'icon', id: item.id, color: state.color })).svg;
      if (closed || token !== selectionVersion) return;
      current = { ...item, svg };
      for (const [id, tile] of tiles) tile.setAttribute('aria-pressed', String(id === item.id));
      renderDetail(current);
    } catch (e) {
      message(e.message, { error: true });
    }
  }

  function renderDetail(item) {
    detail.hidden = false;
    detail.replaceChildren();

    const box = el('div', 'preview');
    box.dataset.plate = String(!TINTABLE.has(item.prefix) && needsPlate(item.svg));
    box.append(safeSvg(item.svg));

    const info = el('div', 'info');
    info.append(el('div', 'name', item.name));
    const setMeta = allInfo[item.prefix];
    const license = el('a', 'license', `${item.set}${TINTABLE.has(item.prefix) ? '' : ' · original colours'}`);
    license.title = setMeta?.license?.title || 'View licence';
    const href = setMeta?.license?.url || `https://icon-sets.iconify.design/${item.prefix}/`;
    if (/^https:\/\//.test(href)) { license.href = href; license.target = '_blank'; license.rel = 'noopener noreferrer'; }
    info.append(license);

    const fav = button('act', () => toggleFavorite(item.id));
    fav.append(glyph('bookmark'));
    detailFavorite = on => {
      fav.setAttribute('aria-pressed', String(on));
      fav.title = on ? 'Remove from Saved' : 'Save to Saved';
      fav.setAttribute('aria-label', fav.title);
    };
    detailFavorite(favorites.includes(item.id));

    const copy = button('act', async () => {
      try {
        await navigator.clipboard.writeText(item.svg);
        message('SVG copied to the clipboard.');
      } catch {
        message('The browser blocked clipboard access here. Download the PNG instead.', { error: true });
      }
    }, 'Copy SVG markup');
    copy.append(glyph('copy'));

    const download = button('act', async () => {
      try {
        download.disabled = true;
        const file = await svgToPng(item.svg, item.id);
        const url = URL.createObjectURL(file);
        const a = el('a');
        a.href = url;
        a.download = file.name;
        shadow.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        await used(item.id);
        message('PNG saved. Upload it from Notion’s Custom tab.');
      } catch (e) { message(e.message, { error: true }); }
      finally { download.disabled = false; }
    }, 'Download as a 280px PNG');
    download.append(glyph('download'));

    const applyButton = button('apply', () => apply(item));
    applyButton.textContent = 'Apply';

    detail.append(box, info, fav, copy, download, applyButton);
  }

  async function apply(item) {
    if (busy || closed) return;
    busy = true;
    const tile = tiles.get(item.id);
    tile?.setAttribute('data-state', 'busy');
    message('Applying icon…');
    try {
      const svg = item.svg || (await request({ type: 'icon', id: item.id, color: state.color })).svg;
      current = { ...item, svg };
      const file = await svgToPng(svg, item.id);
      const outcome = await uploadToNotion(file, popup);
      await used(item.id);
      if (closed) return;
      if (outcome === 'sent') {
        // Notion took the file and said nothing. Claiming success here would be
        // a guess, so the panel stays open — with the preview bar showing, so
        // the ↓ PNG the message points at is one click away rather than behind
        // a right-click nobody has discovered yet.
        tile?.removeAttribute('data-state');
        renderDetail(current);
        message('Image sent to Notion. If the page icon has not changed, download the PNG and upload it from Notion’s Upload tab.');
        return;
      }
      // Confirmation before the panel goes: an upload that leaves no trace on
      // screen is indistinguishable from a click that did nothing.
      tile?.setAttribute('data-state', 'done');
      message('Icon applied.');
      appliedTimer = setTimeout(close, APPLIED_MS);
    } catch (e) {
      tile?.removeAttribute('data-state');
      if (current?.id === item.id) renderDetail(current);
      message(e.message, { error: true });
    } finally {
      busy = false;
    }
  }

  /* ── search wiring ─────────────────────────────────────────────────── */

  function onQuery() {
    state.query = search.value.trim();
    clear.hidden = !search.value;
    clearTimeout(timer);
    version++;
    timer = setTimeout(() => load(), 150);
  }

  search.addEventListener('input', onQuery);
  search.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusTile(0); }
    else if (e.key === 'Enter') { e.preventDefault(); grid.querySelector('.tile')?.click(); }
  });

  /* ── boot ──────────────────────────────────────────────────────────── */

  renderSwatches();
  (popup?.root || document.body).append(host);
  position();
  search.focus();
  showSkeletons();
  // The status line is otherwise empty on open, so it carries the one thing a
  // first-time user cannot discover: that a single click is the whole flow.
  message(integrated ? 'Click an icon to apply it · right-click to preview' : 'Open a page’s icon menu in Notion to apply an icon.');

  (async () => {
    try {
      const [data, stored] = await Promise.all([
        request({ type: 'info' }),
        api.storage.local.get([PREFS, 'favorites', 'recent'])
      ]);
      if (closed) return;
      allInfo = data.sets;
      const valid = id => typeof id === 'string' && /^[a-z0-9-]+:[a-z0-9-]+$/.test(id) && allInfo[id.split(':')[0]];
      favorites = Array.isArray(stored.favorites) ? stored.favorites.filter(valid).slice(0, 200) : [];
      recent = Array.isArray(stored.recent) ? stored.recent.filter(valid).slice(0, 40) : [];

      const prefs = stored[PREFS] || {};
      if (isHex(prefs.color)) state.color = prefs.color;
      if (CATEGORIES.some(([id]) => id === prefs.group)) state.group = prefs.group;
      if (prefs.prefix && allInfo[prefs.prefix]) state.prefix = prefs.prefix;

      search.placeholder = `Filter ${data.count.toLocaleString()} icons…`;
      for (const [prefix, info] of Object.entries(allInfo)) {
        setSelect.append(new Option(`${info.name} (${info.count.toLocaleString()})`, prefix));
      }
      setSelect.value = state.prefix;
      syncCategories();
      syncColorUi();
      ready = true;
      load();
    } catch (e) {
      grid.replaceChildren();
      grid.setAttribute('aria-busy', 'false');
      message(e.message, { error: true });
    }
  })();

  return { close, host };
}
