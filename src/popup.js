import { extensionApi as api } from './api.js';
document.querySelector('#open-library').addEventListener('click', async () => {
  const status = document.querySelector('#status');
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const result = await api.tabs.sendMessage(tab.id, { type: 'open-picker' });
    if (!result?.ok) throw new Error('No content script');
    window.close();
  } catch {
    status.textContent = 'The extension is not connected to this tab. Open Notion (app.notion.com), refresh it, then try again.';
  }
});
