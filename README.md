# Notion Icons Plus

A browser extension that adds **More icons** to Notion's page-icon popup.
27,778 bundled icons across eight sets. Offline fuzzy search, idea synonyms,
brand/developer and colorful/minimal filters, per-collection filters, ink colors,
favorites, recents, and transparent 280 × 280 PNG export.

## Install in Chrome / Edge / Brave

The ready-to-load extension is in `dist/`.

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this project's `dist` directory.
4. Refresh Notion. Open a page's icon menu and click **✦ More icons**.
5. Choose an ink color if desired, then click an icon to apply it immediately.

## Firefox / Zen

The Firefox-specific build is in `dist-firefox/`.

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `dist-firefox/manifest.json`.
3. Refresh Notion and use the same flow.

Temporary add-ons disappear on browser restart. Persistent Firefox installation
requires Mozilla signing; this project is not signed or published. Chromium and
Firefox ZIP bundles are produced by `npm run package` (unzip the Chromium archive
before using Load unpacked).

## How it works

- A content script recognizes the visible Emojis / Icons / Custom tab group.
- It appends one library entry and displays a compact, same-width panel beneath
  the native tabs. Switching to another tab dismisses the library.
- A Shadow DOM panel isolates extension styling from Notion.
- A background script loads bundled Iconify JSON and runs Fuse.js fuzzy search.
- Search understands common ideas like `todo`, `learning`, `finance`, `coding`.
- Selected SVGs are rasterized to PNG, then sent through Notion's image-paste
  handler (or an existing native file input on older versions). The extension
  clicks Save only after Notion enables it. It does not access your clipboard.
- Color affects monochrome sets, including Simple Icons; full-color sets retain
  their original palette. Dark mode starts with white ink; you can change it.
- Hover an icon to see its name and collection. Clicking applies immediately;
  there is no extra Apply button. If upload fails, PNG download is available.
- Right-click an icon to save it as a favorite or download it without applying.
- Icon licenses are linked in the selection preview; notices ship with the build.

No paid icon APIs, network search, tokens, accounts, or private Notion API calls.
Since the image is uploaded to Notion, icons do not depend on this extension or
an external icon CDN after saving, and can appear on other devices.

## Compatibility and honest limitations

**Live Notion upload compatibility has not yet been verified against a logged-in
Notion browser session.** Automated tests and the browser fixture exercise tab
injection, fuzzy search, image conversion, and paste / native-input upload flows.
Notion can change its DOM, labels, or upload handlers; this integration is
best-effort, not an official Notion API. English and several translated tab
labels are recognized, but not every locale. Start with English if detection fails.

If the tab is missing, press **Alt + Shift + I** on a Notion page to open the
library, or click the extension toolbar icon and **Open icon library**. The
extension supports the current `app.notion.com` host and older Notion hosts.
Applying still requires an open native page-icon popup. If native upload
is unavailable, use **↓ PNG**, then upload it manually in Notion's Custom tab.
The extension never reports that Notion saved the icon merely because it sent a
file: wait for Notion's upload to finish and verify the page icon yourself.

The first open may take a moment to index the catalog. Roughly 32 MB is bundled
uncompressed. Search runs in the background, not in Notion's editing thread.
Favorites store icon IDs, not color variants. Designed for desktop web pages;
it does not modify Notion's desktop app, mobile app, or public notion.site pages.

## Development

Use Node 22.12+ (tested with Node 25) and npm.

```sh
npm ci
npm run build
npm test
npm run dev
```

`npm run dev` serves a representative integration fixture at
http://127.0.0.1:4173. It is deliberately labeled **not live Notion**. The fixture
uses the same catalog, picker, detection, and upload code, with a mock extension
messaging API. The demo is excluded from distributable ZIPs.

Source map:

- `src/notion.js`: DOM recognition, native upload adapter, PNG conversion.
- `src/picker.js`: isolated picker and local favorites/recents.
- `src/catalog.js`: fuzzy search, synonyms, SVG generation.
- `src/background.js`: bundled library loading and extension messages.
- `src/content.js`: tab injection and keyboard shortcut.
- `scripts/build.mjs`: Chromium and Firefox builds and license metadata.

After changing code, build, reload the extension, and refresh Notion.
See `PRIVACY.md` and `THIRD_PARTY_NOTICES.md` before distribution.
