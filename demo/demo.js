import { loadCatalog } from '../src/library.js';

let library;
const catalog = () => library ||= loadCatalog(path => `./${path}`);

// Stands in for the extension messaging API so the fixture exercises the real
// picker, detection and upload code paths without a browser extension host.
window.chrome = {
  runtime: {
    async sendMessage(m) {
      try {
        const c = await catalog();
        let data;
        if (m.type === 'info') data = { sets: c.info, count: c.count };
        else if (m.type === 'icon') data = { svg: c.icon(m.id, m.color) };
        else if (m.type === 'icons') data = { icons: c.icons(m.ids, m.color) };
        else {
          const found = c.search(m);
          data = { ...found, items: found.items.map(item => ({ ...item, svg: c.icon(item.id, m.color) })) };
        }
        return { ok: true, data };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }
  },
  storage: {
    local: {
      async get(keys) {
        return Object.fromEntries(keys
          .map(k => [k, localStorage.getItem(k)])
          .filter(([, raw]) => raw !== null)
          .map(([k, raw]) => [k, JSON.parse(raw)]));
      },
      async set(values) {
        for (const [k, v] of Object.entries(values)) localStorage.setItem(k, JSON.stringify(v));
      }
    }
  }
};

const popup = document.querySelector('.popup');
const content = document.querySelector('.native-content');
const pageIcon = document.querySelector('.page-icon');
pageIcon.addEventListener('click', () => { popup.hidden = !popup.hidden; });

document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  if (b.textContent !== 'Upload') return;
  content.replaceChildren();
  const text = document.createElement('p');
  text.textContent = 'Upload your own image';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    pageIcon.replaceChildren(img);
    popup.hidden = true;
    // Simulates Notion unmounting its overlay after a successful upload.
    popup.querySelector('[data-noticons="panel"]')?.remove();
  });
  content.append(text, input);
}));

// Dark-mode switch on the fixture, so the panel's Notion theme handling can be
// checked without a Notion account.
document.querySelector('#theme')?.addEventListener('click', () => {
  document.body.classList.toggle('notion-dark-theme');
});

await import('../src/content.js');
