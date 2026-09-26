import { findIconPopup } from './notion.js';
import { openPicker } from './picker.js';
import { extensionApi as api } from './api.js';

let picker, injected, indicator, injectedRef, palette, dimmed, scanScheduled = false;

function open(popup) {
  picker?.close();
  picker = openPicker({ popup, onClose: () => { picker = undefined; syncTab(false); } });
  syncTab(true, popup);
}

/**
 * Notion has no idea another tab exists, so its own selected tab stays lit
 * while our panel covers the content below it — two tabs looking selected at
 * once. Fading it is done with opacity, which carries to whatever the
 * underline is made of, and is an inline style so it can simply be removed.
 * If Notion re-renders and drops it, the tab returns to normal; nothing breaks.
 */
function dimNativeSelection(popup, on) {
  // Always clear first: re-syncing on a theme change must not strand the
  // previous tab at reduced opacity.
  if (dimmed?.isConnected) dimmed.style.removeProperty('opacity');
  dimmed = undefined;
  if (!on || !popup || palette.active === palette.idle) return;
  dimmed = [popup.emoji, popup.icons, popup.custom]
    .find(tab => tab && getComputedStyle(tab).color === palette.active);
  if (dimmed) dimmed.style.opacity = '.45';
}

/**
 * Notion marks the selected tab with a colour change and an underline, and
 * gives no class or attribute to read either from. With three native tabs, the
 * idle colour is the one that appears twice and the selected colour is the odd
 * one out — which is enough to match both states without hard-coding a palette
 * that would be wrong in the other theme.
 */
function readPalette(popup) {
  const colors = [popup.emoji, popup.icons, popup.custom]
    .filter(Boolean)
    .map(tab => getComputedStyle(tab).color);
  const counts = new Map();
  for (const color of colors) counts.set(color, (counts.get(color) || 0) + 1);
  const idle = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || 'inherit';
  return { idle, active: colors.find(color => color !== idle) || idle };
}

/**
 * Copies the neighbouring native tab's own computed typography and spacing
 * instead of guessing at them. Notion restyles this popup fairly often, and a
 * hard-coded 12px label is the thing that gives an injected tab away.
 */
function matchNativeTab(button, reference) {
  const s = getComputedStyle(reference);
  const padding = s.padding === '0px' ? '7px 8px' : s.padding;
  Object.assign(button.style, {
    font: 'inherit',
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    padding,
    borderRadius: s.borderRadius === '0px' ? '4px' : s.borderRadius,
    background: 'transparent',
    border: '0',
    position: 'relative',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: '0',
    transition: 'color 120ms ease, background 120ms ease'
  });
  // The underline is its own square-cornered element. An inset box-shadow, the
  // obvious alternative, bends around the button's rounded corners and reads as
  // a bracket rather than as Notion's straight rule.
  Object.assign(indicator.style, {
    left: s.paddingLeft === '0px' ? '8px' : s.paddingLeft,
    right: s.paddingRight === '0px' ? '8px' : s.paddingRight
  });
}

function syncTab(isOpen, popup) {
  if (!injected) return;
  injected.setAttribute('aria-expanded', String(isOpen));
  injected.style.color = isOpen ? palette.active : palette.idle;
  injected.style.background = 'transparent';
  indicator.style.opacity = isOpen ? '1' : '0';
  dimNativeSelection(popup, isOpen);
}

function scan() {
  scanScheduled = false;
  if (picker && !picker.host.isConnected) picker.close();
  const popup = findIconPopup();
  if (!popup || popup.tabs.querySelector('[data-noticons="tab"]')) return;

  injected = document.createElement('button');
  injected.type = 'button';
  injected.textContent = 'More icons';
  injected.dataset.noticons = 'tab';
  injected.setAttribute('aria-haspopup', 'dialog');
  injected.title = 'Noticons — thousands more page icons (Alt+Shift+I)';

  indicator = document.createElement('span');
  indicator.setAttribute('aria-hidden', 'true');
  Object.assign(indicator.style, {
    position: 'absolute',
    bottom: '0',
    height: '2px',
    borderRadius: '1px',
    background: 'currentColor',
    opacity: '0',
    transition: 'opacity 120ms ease',
    pointerEvents: 'none'
  });
  injected.append(indicator);

  injectedRef = popup.icons;
  palette = readPalette(popup);
  matchNativeTab(injected, injectedRef);
  syncTab(false);

  injected.addEventListener('pointerenter', () => {
    if (injected.getAttribute('aria-expanded') === 'false') injected.style.background = 'rgba(127,127,127,.12)';
  });
  injected.addEventListener('pointerleave', () => { injected.style.background = 'transparent'; });
  injected.addEventListener('click', e => { e.stopPropagation(); open(popup); });
  popup.tabs.append(injected);
}

const observer = new MutationObserver(records => {
  // Ignore our own shadow UI and attribute churn; only native DOM additions
  // can introduce a new icon popup.
  if (scanScheduled || !records.some(r => r.type === 'attributes' || r.type === 'childList' && (r.addedNodes.length || r.removedNodes.length))) return;
  scanScheduled = true;
  requestAnimationFrame(scan);
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });

// The tab's colours are copied from its siblings, so they go stale the moment
// Notion's light/dark switch is flipped while the popup is open.
new MutationObserver(() => {
  if (!injected?.isConnected || !injectedRef?.isConnected) return;
  const popup = findIconPopup();
  if (popup) palette = readPalette(popup);
  matchNativeTab(injected, injectedRef);
  syncTab(injected.getAttribute('aria-expanded') === 'true', popup);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });

document.addEventListener('keydown', e => {
  if (e.altKey && e.shiftKey && e.code === 'KeyI' && !e.repeat) {
    e.preventDefault();
    open(findIconPopup());
  }
});

scan();

api.runtime.onMessage?.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || message?.type !== 'open-picker') return false;
  open(findIconPopup());
  respond({ ok: true });
  return false;
});
