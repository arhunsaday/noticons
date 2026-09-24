// UI chrome glyphs, built with createElementNS rather than innerHTML: Notion
// serves a Trusted Types policy, and markup assignment is refused under it.
const NS = 'http://www.w3.org/2000/svg';

const SHAPES = {
  search: [['circle', { cx: 7, cy: 7, r: 4.5 }], ['path', { d: 'M10.6 10.6 14 14' }]],
  close: [['path', { d: 'M4 4l8 8M12 4l-8 8' }]],
  sparkle: [['path', { d: 'M8 1.8l1.5 4.2 4.2 1.5-4.2 1.5L8 13.2l-1.5-4.2L2.3 7.5l4.2-1.5z' }]],
  grid: [['rect', { x: 2.5, y: 2.5, width: 4.6, height: 4.6, rx: 1.3 }], ['rect', { x: 8.9, y: 2.5, width: 4.6, height: 4.6, rx: 1.3 }],
    ['rect', { x: 2.5, y: 8.9, width: 4.6, height: 4.6, rx: 1.3 }], ['rect', { x: 8.9, y: 8.9, width: 4.6, height: 4.6, rx: 1.3 }]],
  tag: [['path', { d: 'M2.6 8.9V3.4a.8.8 0 0 1 .8-.8h5.5l5 5-6.3 6.3z' }], ['circle', { cx: 5.6, cy: 5.6, r: 1 }]],
  droplet: [['path', { d: 'M8 2.2s4.2 4.3 4.2 7a4.2 4.2 0 0 1-8.4 0c0-2.7 4.2-7 4.2-7z' }]],
  pen: [['path', { d: 'M11.4 2.4l2.2 2.2-8 8-2.9.7.7-2.9z' }]],
  heart: [['path', { d: 'M8 13.4C5.2 11.6 2.4 9.3 2.4 6.6A2.9 2.9 0 0 1 8 5.2a2.9 2.9 0 0 1 5.6 1.4c0 2.7-2.8 5-5.6 6.8z' }]],
  clock: [['circle', { cx: 8, cy: 8, r: 5.6 }], ['path', { d: 'M8 4.6V8l2.5 1.5' }]],
  bookmark: [['path', { d: 'M4 2.9h8v10.4L8 10.4l-4 2.9z' }]],
  download: [['path', { d: 'M8 2.4v7.4M4.8 6.9 8 10.1l3.2-3.2M2.9 13.3h10.2' }]],
  copy: [['rect', { x: 5.6, y: 5.6, width: 7.8, height: 7.8, rx: 1.6 }], ['path', { d: 'M10.6 3.4H4.2a1.6 1.6 0 0 0-1.6 1.6v6.4' }]],
  check: [['path', { d: 'M3.2 8.4 6.5 11.7 12.8 4.6' }]],
  alert: [['circle', { cx: 8, cy: 8, r: 5.6 }], ['path', { d: 'M8 5.2v3.4M8 10.8h.01' }]],
  smile: [['circle', { cx: 8, cy: 8, r: 5.6 }], ['path', { d: 'M5.6 9.3a3 3 0 0 0 4.8 0' }],
    ['path', { d: 'M6.2 6.3h.01M9.8 6.3h.01' }]],
  contrast: [['circle', { cx: 8, cy: 8, r: 5.6 }],
    ['path', { d: 'M8 2.4a5.6 5.6 0 0 1 0 11.2z', fill: 'currentColor', stroke: 'none' }]]
};

const FILLED = new Set(['sparkle', 'heart', 'bookmark', 'grid', 'tag']);

export function glyph(name) {
  const shapes = SHAPES[name];
  if (!shapes) throw new Error(`Unknown glyph: ${name}`);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const filled = FILLED.has(name);
  svg.setAttribute('fill', filled ? 'currentColor' : 'none');
  svg.setAttribute('stroke', filled ? 'none' : 'currentColor');
  if (!filled) {
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  }
  for (const [tag, attrs] of shapes) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    svg.append(node);
  }
  return svg;
}
