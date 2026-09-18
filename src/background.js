import { createCatalog } from './catalog.js';
import { extensionApi as api } from './api.js';
let loaded;
function catalog() {
  if (!loaded) loaded = fetch(api.runtime.getURL('catalog.json')).then(r => {
    if (!r.ok) throw new Error('Cannot load bundled icon library');
    return r.json();
  }).then(createCatalog).catch(e => { loaded = undefined; throw e; });
  return loaded;
}
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || !['search', 'icon', 'info'].includes(message?.type)) return false;
  (async () => {
    const c = await catalog();
    if (message.type === 'info') return { sets: c.info, count: c.count };
    if (message.type === 'icon') return { svg: c.icon(message.id, message.color) };
    const result = c.search({ query: message.query, group: message.group, prefix: message.prefix, offset: Math.max(0, Math.min(50000, Number(message.offset) || 0)), limit: 96 });
    return { ...result, items: result.items.map(item => ({ ...item, svg: c.icon(item.id, message.color) })) };
  })().then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error.message }));
  return true;
});
