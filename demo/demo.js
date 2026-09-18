import { createCatalog } from '../src/catalog.js';
let library;
const catalog = () => library ||= fetch('./catalog.json').then(r => r.json()).then(createCatalog);
window.chrome = {
  runtime: {
    async sendMessage(m) {
      try {
        const c = await catalog();
        let data;
        if (m.type === 'info') data = { sets: c.info, count: c.count };
        else if (m.type === 'icon') data = { svg: c.icon(m.id, m.color) };
        else { const found = c.search(m); data = { ...found, items: found.items.map(item => ({ ...item, svg: c.icon(item.id, m.color) })) }; }
        return { ok: true, data };
      } catch(e) { return { ok: false, error: e.message }; }
    }
  },
  storage: { local: {
    async get(keys) { return Object.fromEntries(keys.map(k => [k, JSON.parse(localStorage.getItem(k) || '[]')])); },
    async set(values) { for (const [k, v] of Object.entries(values)) localStorage.setItem(k, JSON.stringify(v)); }
  } }
};
const popup = document.querySelector('.popup');
const content = document.querySelector('.native-content');
const pageIcon = document.querySelector('.page-icon');
pageIcon.addEventListener('click', () => { popup.hidden = !popup.hidden; });
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  if (b.textContent === 'Custom') {
    content.replaceChildren();
    const text = document.createElement('p'); text.textContent = 'Upload your own image';
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files[0]; if (!file) return;
      const img = new Image(); img.src = URL.createObjectURL(file); img.alt = file.name;
      pageIcon.replaceChildren(img);
      popup.hidden = true;
      // Simulate unmounting a native Notion overlay on successful upload.
      popup.querySelector('[data-notion-icons-plus="panel"]')?.remove();
    });
    content.append(text, input);
  }
}));
await import('../src/content.js');
