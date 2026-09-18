import { findIconPopup } from './notion.js';
import { openPicker } from './picker.js';
import { extensionApi as api } from './api.js';
let picker, injected, scanScheduled = false;
function open(popup) {
  picker?.close();
  picker = openPicker({ popup, onClose: () => { picker = undefined; injected?.setAttribute('aria-expanded', 'false'); if (injected) injected.style.boxShadow = 'none'; } });
  injected?.setAttribute('aria-expanded', 'true');
  if (injected) injected.style.boxShadow = 'inset 0 -2px currentColor';
}
function scan() {
  scanScheduled = false;
  if (picker && !picker.host.isConnected) picker.close();
  const popup = findIconPopup();
  if (!popup || popup.tabs.querySelector('[data-notion-icons-plus="tab"]')) return;
  injected = document.createElement('button');
  injected.type = 'button'; injected.textContent = 'More icons'; injected.dataset.notionIconsPlus = 'tab';
  injected.setAttribute('aria-haspopup', 'dialog'); injected.setAttribute('aria-expanded', 'false');
  injected.style.cssText = 'font:inherit;font-size:12px;color:inherit;background:transparent;border:0;border-radius:5px;padding:7px 8px;cursor:pointer;white-space:nowrap;flex-shrink:0;';
  injected.addEventListener('click', e => { e.stopPropagation(); open(popup); });
  popup.tabs.append(injected);
}
const observer = new MutationObserver(records => {
  // Ignore our own shadow UI and attribute changes; only inspect native DOM additions.
  if (scanScheduled || !records.some(r => r.type === 'attributes' || r.type === 'childList' && (r.addedNodes.length || r.removedNodes.length))) return;
  scanScheduled = true; requestAnimationFrame(scan);
});
observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden'] });
document.addEventListener('keydown', e => {
  if (e.altKey && e.shiftKey && e.code === 'KeyI' && !e.repeat) { e.preventDefault(); open(findIconPopup()); }
});
scan();
api.runtime.onMessage?.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || message?.type !== 'open-picker') return false;
  open(findIconPopup());
  respond({ ok: true });
  return false;
});
