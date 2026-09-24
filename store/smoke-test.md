# Manual smoke test — Noticon

Run before every store submission, on a **real, logged-in Notion page**, in a
clean profile with the unpacked build loaded. Unit tests cover detection,
search, sanitisation and both upload paths; these are the things only a live
session can prove.

## Setup

1. `npm run verify`
2. Load `dist/` (Chromium) or `dist-firefox/manifest.json` (Firefox).
3. Open a Notion page you can edit. Refresh it.

## Checks

| # | Step | Expected |
| --- | --- | --- |
| 1 | Click the page icon | Notion's popup opens with a **More icons** tab that matches its neighbours' size, weight and colour |
| 2 | Click **More icons** | The panel opens under the tabs, same width, no gap or overhang |
| 3 | Wait for the grid | Suggested icons appear; the count reads 39,819 |
| 4 | Type `roadmap` | Map, route, flag and milestone icons appear within a moment |
| 5 | Clear the search with the × | Suggested icons return |
| 6 | Click the colour dot, pick Green | The monochrome icons in the grid turn green; colourful ones do not change |
| 7 | Enter `#FF0088` in Custom | The grid follows; an invalid value shows a red field and changes nothing |
| 8 | Click an icon | Status says "Applying…", the tile flashes, the panel closes, **and the page icon changes** |
| 8a | Same, on a Notion build whose Upload tab has no Save button | Still succeeds. It must never report "Notion did not accept the image" for an upload that worked |
| 8b | Watch the tab row while the panel is open | **Only "More icons" looks selected.** Notion's own tab is faded, and the underline is a straight rule matching the native one, not a curve |
| 9 | Reload the page | The icon is still there (Notion stored it, not the extension) |
| 10 | Reopen the panel | Your colour is remembered; **Recent** contains the icon you applied |
| 11 | Hover an icon, click the bookmark | It appears under **Saved** |
| 12 | Right-click an icon | The preview bar appears without applying anything |
| 13 | In the preview bar, click ↓ | A transparent 280 × 280 PNG downloads |
| 14 | In the preview bar, click the copy glyph | The SVG markup is on the clipboard |
| 15 | Switch Notion to dark mode with the panel open | The panel and the injected tab both follow immediately |
| 16 | Press <kbd>Esc</kbd> | The panel closes and focus returns to the page |
| 17 | Press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> with no icon menu open | The panel opens and says an icon menu is needed to apply |
| 18 | Tab into the search, press <kbd>↓</kbd>, then arrows | Focus moves through the grid one tile at a time |
| 19 | Press <kbd>Enter</kbd> in the search field | The first result applies |
| 20 | Click the toolbar button on a non-Notion tab | A clear message, not a silent failure |

## Failure paths worth provoking

- Open Notion's Custom tab, paste a link, leave it unsaved, then try to apply →
  must refuse with "Notion already has an unsaved image", not overwrite it.
- Disable the network → everything must still work; nothing is fetched.
- Reload the extension while the panel is open → applying must report
  "Extension was updated. Refresh this Notion page."

## Record

| Date | Version | Browser | Result |
| --- | --- | --- | --- |
| | | | |
