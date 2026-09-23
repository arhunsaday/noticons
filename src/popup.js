import { extensionApi as api } from './api.js';

const open = document.querySelector('#open');
const status = document.querySelector('#status');

function say(text, error = false) {
  status.textContent = text;
  status.dataset.show = String(Boolean(text));
  status.dataset.error = String(error);
}

document.querySelector('#version').textContent = `v${api.runtime.getManifest().version}`;

// The real binding can differ from the suggested one, so it is read back rather
// than hard-coded into the tip.
(async () => {
  try {
    const [command] = (await api.commands?.getAll?.()) ?? [];
    if (command?.shortcut) {
      document.querySelector('#shortcut').textContent = command.shortcut.replace(/\+/g, ' + ');
    }
  } catch { /* commands API is unavailable in some builds; the default hint stands */ }
})();

document.querySelector('#shortcuts').addEventListener('click', async () => {
  const firefox = api.runtime.getURL('').startsWith('moz-extension://');
  await api.tabs.create({ url: firefox ? 'about:addons' : 'chrome://extensions/shortcuts' });
  window.close();
});

open.addEventListener('click', async () => {
  open.disabled = true;
  say('');
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('no tab');
    const result = await api.tabs.sendMessage(tab.id, { type: 'open-picker' });
    if (!result?.ok) throw new Error('no content script');
    window.close();
  } catch {
    say('This tab is not a Notion page the extension can reach. Open notion.so or notion.com, refresh the tab, then try again.', true);
  } finally {
    open.disabled = false;
  }
});
