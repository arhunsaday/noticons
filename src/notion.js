// Notion translates this popup, and detection is label-based, so every locale
// that is not listed here silently loses the feature. English first, then the
// languages Notion actually ships a UI for.
const LABELS = {
  emoji: /^(emojis?|émoticônes|emojis?|emoji|絵文字|表情符号|表情符號|이모지|이모티콘)$/i,
  icons: /^(icons?|icônes|iconos?|ícones?|icone|symbole|アイコン|图标|圖示|아이콘)$/i,
  custom: /^(custom|custom image|upload|upload image|personnalisé|personnalisée|importer|personalizado|personalizada|subir|carregar|benutzerdefiniert|hochladen|personalizzato|carica|カスタム|アップロード|上传|自定义|自訂|사용자\s?지정|업로드)$/i
};
const UPLOAD_IMAGE = /^(upload an image|upload image|upload a file|upload file|choose an image|choose a file|choose file|select an image|select a file|browse|browse files|importer une image|choisir une image|parcourir|subir una imagen|elegir una imagen|carregar imagem|escolher imagem|bild hochladen|datei auswählen|durchsuchen|carica un'immagine|scegli un file|画像をアップロード|ファイルを選択|上传图片|选择文件|選擇檔案|이미지 업로드|파일 선택)$/i;
// Fallback for labels the exact list has not caught up with. Only ever applied
// inside the already-identified upload panel, and never to the tab itself.
const UPLOAD_LOOSE = /\b(upload|choose|select|browse|importer|parcourir|hochladen|auswählen|carica|scegli|subir|elegir|carregar|escolher|アップロード|選択|上传|选择|업로드|선택)\b/i;
const UPLOAD_TAB = /^(upload|importer|subir|carregar|hochladen|carica|アップロード|上传|업로드)$/i;
const SAVE = /^(save|enregistrer|guardar|salvar|speichern|salva|保存|저장)$/i;
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
const fileInputs = (root = document) => [...root.querySelectorAll('input[type="file"]')];

function deliver(input, transfer) {
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function uploadButton(scope, exclude) {
  const controls = [...scope.querySelectorAll(controlSelector)].filter(e => e !== exclude && isVisible(e));
  return controls.find(e => UPLOAD_IMAGE.test(label(e))) || controls.find(e => UPLOAD_LOOSE.test(label(e)));
}

/**
 * Last resort, when Notion exposes no file input and no paste target: press its
 * upload button, and cancel the click it makes on the file input it creates.
 * Cancelling keeps the operating system's file chooser shut while leaving the
 * input itself in the DOM, so the file can be handed over directly.
 */
async function captureFileInput(button, before) {
  let captured = null;
  const intercept = event => {
    const target = event.target;
    if (target?.tagName === 'INPUT' && target.type === 'file') {
      event.preventDefault();
      captured = target;
    }
  };
  document.addEventListener('click', intercept, true);
  try {
    button.click();
    return await waitFor(() => captured || fileInputs().find(input => !before.has(input)), 1500, '');
  } catch {
    return null;
  } finally {
    document.removeEventListener('click', intercept, true);
  }
}

/**
 * Hands the PNG to Notion's own upload, and reports what Notion did with it:
 *
 *   'saved'   — Notion asked for a confirming Save, and it was clicked.
 *   'applied' — Notion took the image and closed its icon menu itself.
 *   'sent'    — the file was delivered, but Notion gave no sign either way.
 *
 * The third case is not a failure and not a success. Current Notion applies an
 * uploaded page icon immediately with no Save button, so demanding one reported
 * uploads that had in fact worked as errors.
 */
export async function uploadToNotion(file, popup, { settleMs = 6000 } = {}) {
  if (!popup?.root.isConnected) throw new Error('Open Notion’s page icon menu first, then try Apply again.');
  const controls = [...popup.root.querySelectorAll(controlSelector)].filter(isVisible);
  const custom = controls.find(e => LABELS.custom.test(label(e)));
  if (!custom) throw new Error('Cannot find Notion’s upload tab. Download the PNG and upload it manually.');

  const before = new Set(fileInputs());
  custom.click();

  const getScope = () => findIconPopup()?.root || popup.root;
  const findSave = () => [...getScope().querySelectorAll(controlSelector)].find(e => SAVE.test(label(e)) && isVisible(e));
  const enabled = e => e && !e.disabled && !e.hasAttribute('disabled') && e.getAttribute('aria-disabled') !== 'true' && getComputedStyle(e).pointerEvents !== 'none';

  // Notion dismisses the icon menu once it has taken the image — by unmounting
  // it on some builds and by hiding it on others.
  const dismissed = () => !popup.root.isConnected || !isVisible(popup.root);

  const previousSave = findSave();
  if (enabled(previousSave)) throw new Error('Notion already has an unsaved image or link. Cancel that preview and reopen the icon menu before applying a new icon.');

  const uploader = await waitFor(() => {
    const scope = getScope();
    const existing = scope.querySelector('input[type="file"]') || fileInputs().find(input => !before.has(input));
    if (existing) return { input: existing };
    const button = uploadButton(scope, custom);
    if (button) return { button };
    // Some Notion versions put the upload behind a further sub-tab.
    const sub = [...scope.querySelectorAll(controlSelector)].find(e => e !== custom && UPLOAD_TAB.test(label(e)) && isVisible(e));
    if (sub) sub.click();
    return null;
  });

  const transfer = new DataTransfer();
  transfer.items.add(file);

  if (uploader.input) {
    deliver(uploader.input, transfer);
  } else {
    // The upload panel accepts pasted images, and a paste has no side effects
    // if Notion ignores it — unlike pressing the button, which can open a file
    // chooser. So it is tried first, and the button only if it leads nowhere.
    uploader.button.focus();
    uploader.button.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, composed: true, clipboardData: transfer }));
    const accepted = await waitFor(
      () => enabled(findSave()) || dismissed() || fileInputs().some(input => input.files?.length),
      1200, ''
    ).catch(() => false);
    if (!accepted) {
      const captured = await captureFileInput(uploader.button, before);
      if (captured) deliver(captured, transfer);
    }
  }

  // Notion either asks for a confirming Save, or applies the image and closes
  // the menu on its own. Handing over a file is not evidence it kept it, so an
  // absence of both is reported as exactly that, rather than as either.
  const outcome = await waitFor(() => {
    const save = findSave();
    if (enabled(save)) return { save };
    if (dismissed()) return { closed: true };
    return null;
  }, settleMs, '').catch(() => null);

  if (outcome?.save) {
    outcome.save.click();
    return 'saved';
  }
  return outcome?.closed ? 'applied' : 'sent';
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
