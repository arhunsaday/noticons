const LABELS = {
  emoji: /^(emojis?|émoticônes|絵文字|表情符号)$/i,
  icons: /^(icons?|icônes|symbole|アイコン|图标)$/i,
  custom: /^(custom|upload|upload image|custom image|personnalisé|personnalisée|importer|カスタム|上传|自定义)$/i
};
const controlSelector = '[role="tab"], [role="button"], button';
export function label(element) {
  return (element.getAttribute('aria-label') || element.textContent || '').trim();
}
export function isVisible(element) {
  return element.isConnected && element.getClientRects().length > 0 && !element.closest('[hidden], [aria-hidden="true"]');
}
export function findIconPopup(doc = document) {
  const emojiControls = [...doc.querySelectorAll(controlSelector)].filter(e => LABELS.emoji.test(label(e)) && isVisible(e));
  for (const emoji of emojiControls) {
    let parent = emoji.parentElement;
    for (let depth = 0; parent && depth < 7; depth++, parent = parent.parentElement) {
      const controls = [...parent.querySelectorAll(controlSelector)].filter(isVisible);
      const icons = controls.find(e => LABELS.icons.test(label(e)));
      const custom = controls.find(e => LABELS.custom.test(label(e)));
      if (!icons || !custom) continue;
      const rect = parent.getBoundingClientRect();
      // A popup, not a page containing unrelated 'Icons' / 'Upload' buttons.
      if (rect.width < 180 || rect.width > 750 || rect.height > 850) break;
      let tabs = emoji.parentElement;
      while (tabs && !tabs.contains(icons)) tabs = tabs.parentElement;
      if (!tabs || !tabs.contains(custom)) tabs = parent;
      let root = parent;
      // Tabs often share a tiny row. The upload input lives in the panel below it.
      for (let n = 0; root.getBoundingClientRect().height < 100 && root.parentElement && n < 4; n++) {
        const next = root.parentElement;
        const bounds = next.getBoundingClientRect();
        if (bounds.width > 750 || bounds.height > 850) break;
        root = next;
      }
      return { root, tabs, emoji, icons, custom };
    }
  }
  return null;
}
export function waitFor(find, timeout = 1600, errorMessage = 'Notion’s upload control was not found. Download the PNG and upload it manually.') {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    function check() {
      const value = find();
      if (value) return resolve(value);
      if (Date.now() - started >= timeout) return reject(new Error(errorMessage));
      setTimeout(check, 60);
    }
    check();
  });
}
export async function uploadToNotion(file, popup) {
  if (!popup?.root.isConnected) throw new Error('Open Notion’s page icon menu first, then try Apply again.');
  const controls = [...popup.root.querySelectorAll(controlSelector)].filter(isVisible);
  const custom = controls.find(e => LABELS.custom.test(label(e)));
  if (!custom) throw new Error('Cannot find Notion’s custom image tab. Download the PNG and upload it manually.');
  custom.click();
  const getScope = () => findIconPopup()?.root || popup.root;
  const uploader = await waitFor(() => {
    const current = findIconPopup();
    const scope = current?.root || popup.root;
    const file = scope.querySelector('input[type="file"]');
    if (file) return { input: file, scope };
    const imageButton = [...scope.querySelectorAll(controlSelector)].find(e => /^(upload an image|upload image|importer une image)$/i.test(label(e)) && isVisible(e));
    if (imageButton) return { pasteTarget: imageButton, scope };
    // Some Notion versions expose an additional Upload sub-tab.
    const upload = [...scope.querySelectorAll(controlSelector)].find(e => /^upload$|^importer$/i.test(label(e)) && isVisible(e));
    if (upload && upload !== custom) upload.click();
    return null;
  });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  const findSave = () => [...getScope().querySelectorAll(controlSelector)].find(e => /^(save|enregistrer)$/i.test(label(e)) && isVisible(e));
  const enabled = e => e && !e.disabled && !e.hasAttribute('disabled') && e.getAttribute('aria-disabled') !== 'true' && getComputedStyle(e).pointerEvents !== 'none';
  const previousSave = findSave();
  if (enabled(previousSave)) throw new Error('Notion already has an unsaved image or link. Cancel that preview and reopen the icon menu before applying a new icon.');
  if (uploader.input) {
    uploader.input.files = transfer.files;
    uploader.input.dispatchEvent(new Event('input', { bubbles: true }));
    uploader.input.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // Current Notion creates its file chooser lazily, sometimes detached from DOM.
    // The Upload panel explicitly supports pasting images. This event supplies
    // the selected PNG without reading or replacing the user's real clipboard.
    uploader.pasteTarget.focus();
    uploader.pasteTarget.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, composed: true, clipboardData: transfer }));
  }
  if (previousSave || uploader.pasteTarget) {
    const save = await waitFor(() => {
      const button = findSave();
      return enabled(button) ? button : null;
    }, 10000, 'Notion did not accept the image paste. Download the PNG and use Upload an image instead.');
    save.click();
  }
  // Saving is owned by Notion. Dispatching a file is not proof of persistence.
}
export async function svgToPng(svg, name) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 280;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image conversion is unavailable in this browser.');
    // Room to breathe, matching Notion’s suggested 280px page-icon size.
    context.drawImage(image, 14, 14, 252, 252);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not create the PNG.');
    return new File([blob], `${name.replace(/[^a-z0-9-]/gi, '-')}.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
