import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { findIconPopup, uploadToNotion, waitFor } from '../src/notion.js';
import { needsPlate, safeSvg } from '../src/picker.js';
function setup(html) {
  const dom = new JSDOM(html);
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.getComputedStyle = dom.window.getComputedStyle;
  globalThis.ClipboardEvent = class extends dom.window.Event {
    constructor(type, options) { super(type, options); this.clipboardData = options.clipboardData; }
  };
  globalThis.DataTransfer = class { files = []; items = { add: file => this.files.push(file) }; };
  dom.window.HTMLElement.prototype.getClientRects = function() { return this.closest('[hidden]') ? [] : [{}]; };
  dom.window.HTMLElement.prototype.getBoundingClientRect = function() { return { width: this.tagName === 'BODY' ? 1200 : 420, height: this.classList.contains('tabs') ? 40 : 300 }; };
  return dom;
}
const fixture = '<div class="popup"><div class="tabs"><button role="tab">Emojis</button><button role="tab">Icons</button><button role="tab">Custom</button></div><div class="body"></div></div>';
test('detects native tabs and chooses popup, not tab row', () => {
  setup(fixture);
  const popup = findIconPopup();
  assert.equal(popup.tabs.className, 'tabs'); assert.equal(popup.root.className, 'popup');
});
test('ignores hidden popup and unrelated page content', () => {
  setup(`<div hidden>${fixture}</div>`); assert.equal(findIconPopup(), null);
  setup('<button>Emojis</button><article><button>Icons</button><button>Upload</button></article>'); assert.equal(findIconPopup(), null);
});
test('passes file through custom upload, without private API calls', async () => {
  const dom = setup(fixture);
  const popup = findIconPopup(); let changed = false;
  popup.custom.addEventListener('click', () => {
    const input = document.createElement('input'); input.type = 'file';
    Object.defineProperty(input, 'files', { writable: true, value: [] });
    input.addEventListener('change', () => { changed = input.files[0].name === 'heart.png'; });
    popup.root.querySelector('.body').append(input);
  });
  globalThis.DataTransfer = class { files = []; items = { add: file => this.files.push(file) }; };
  const outcome = await uploadToNotion(new dom.window.File(['png'], 'heart.png'), popup, { settleMs: 120 });
  assert.ok(changed);
  assert.equal(outcome, 'sent');
});
test('fails safely when icon popup is missing', async () => {
  await assert.rejects(uploadToNotion({}, null), /Open Notion/);
  await assert.rejects(waitFor(() => null, 1), /upload control/);
});
test('supports current Emoji / Icons / Upload panel using paste and Save', async () => {
  const dom = setup(fixture.replace('Emojis', 'Emoji').replace('Custom', 'Upload'));
  const popup = findIconPopup(); let pasted, saved = false;
  popup.custom.addEventListener('click', () => {
    popup.root.querySelector('.body').innerHTML = '<button>Upload an image</button><button disabled>Save</button>';
    const save = popup.root.querySelector('button[disabled]');
    popup.root.addEventListener('paste', e => { pasted = e.clipboardData.files[0]; setTimeout(() => { save.disabled = false; }, 10); });
    save.addEventListener('click', () => { saved = true; });
  });
  const image = new dom.window.File(['png'], 'selected.png', { type: 'image/png' });
  const outcome = await uploadToNotion(image, popup, { settleMs: 2000 });
  assert.equal(pasted, image); assert.ok(saved);
  assert.equal(outcome, 'saved');
});
test('does not save a stale unrelated upload preview', async () => {
  setup(fixture);
  const popup = findIconPopup(); let saved = false;
  popup.custom.addEventListener('click', () => {
    popup.root.querySelector('.body').innerHTML = '<button>Upload an image</button><button>Save</button>';
    popup.root.querySelector('.body button:last-child').addEventListener('click', () => { saved = true; });
  });
  await assert.rejects(uploadToNotion({}, popup, { settleMs: 120 }), /unsaved image/);
  assert.equal(saved, false);
});
test('SVG sanitation strips active content and external references', () => {
  setup('');
  const svg = safeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="bad()"><script>bad()</script><foreignObject/><image href="https://bad"/><path onclick="bad()" d="M0 0"/><use href="https://bad"/></svg>');
  assert.equal(svg.querySelector('script, foreignObject, image'), null);
  assert.equal(svg.querySelector('path').getAttribute('onclick'), null);
  assert.equal(svg.querySelector('use').getAttribute('href'), null);
});

test('only dark-on-transparent icons get a light plate in dark mode', () => {
  setup('');
  assert.equal(needsPlate('<svg><path fill="#181717" d="M0 0"/></svg>'), true);
  assert.equal(needsPlate('<svg><path fill="#1DB954" d="M0 0"/></svg>'), false);
  assert.equal(needsPlate('<svg><path fill="#000"/><path fill="#fff"/></svg>'), false);
  assert.equal(needsPlate('<svg><path fill="currentColor"/></svg>'), false);
});

test('an upload panel with no Save button is not treated as a failure', async () => {
  // Regression: current Notion applies an uploaded page icon immediately and
  // shows no Save button. Demanding one reported working uploads as errors.
  const dom = setup(fixture.replace('Custom', 'Upload'));
  const popup = findIconPopup();
  let received;
  popup.custom.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { writable: true, value: [] });
    input.addEventListener('change', () => { received = input.files[0]; });
    popup.root.querySelector('.body').append(input);
  });
  const image = new dom.window.File(['png'], 'selected.png', { type: 'image/png' });
  const outcome = await uploadToNotion(image, popup, { settleMs: 200 });
  assert.equal(received, image);
  assert.equal(outcome, 'sent');
});

test('reports applied when Notion takes the image and closes its menu', async () => {
  const dom = setup(fixture.replace('Custom', 'Upload'));
  const popup = findIconPopup();
  popup.custom.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { writable: true, value: [] });
    // Notion unmounts the icon menu once it has accepted the image.
    input.addEventListener('change', () => setTimeout(() => popup.root.remove(), 10));
    popup.root.querySelector('.body').append(input);
  });
  const outcome = await uploadToNotion(new dom.window.File(['png'], 'x.png'), popup, { settleMs: 2000 });
  assert.equal(outcome, 'applied');
});

test('finds the file chooser behind a label the exact list does not know', async () => {
  const dom = setup(fixture.replace('Custom', 'Upload'));
  const popup = findIconPopup();
  let pasted;
  popup.custom.addEventListener('click', () => {
    popup.root.querySelector('.body').innerHTML = '<button>Choose a picture…</button>';
    popup.root.addEventListener('paste', e => { pasted = e.clipboardData.files[0]; });
  });
  const image = new dom.window.File(['png'], 'x.png', { type: 'image/png' });
  await uploadToNotion(image, popup, { settleMs: 120 });
  assert.equal(pasted, image);
});
