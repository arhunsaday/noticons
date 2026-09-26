# Privacy policy — Noticons

*Last updated: 2026-09-23*

**Noticons collects nothing.** No analytics, no telemetry, no external requests,
no accounts, no identifiers. There is no server; there is nothing to collect it
with.

## What runs, and where

Search and icon rendering use a catalogue bundled inside the extension package.
Nothing is fetched at runtime. The extension makes no network requests of any
kind.

The content script runs only on `notion.so` and `notion.com`, including their
`www` and `app` hosts. It reads the visible controls of the page-icon menu in
order to add its tab and to hand over the chosen image. It does not read your
page content, scrape documents, read cookies, or call Notion's private API.

## What is stored

In your browser's local extension storage, on your device only:

| Key | Contents |
| --- | --- |
| `favorites` | Icon identifiers you saved, e.g. `lucide:heart` — at most 200 |
| `recent` | Icon identifiers you applied or downloaded — at most 40 |
| `prefs` | Your chosen colour, category and collection filter |

That is the complete list. It never leaves your device and is deleted when you
uninstall the extension.

## Applying an icon

Choosing an icon converts the bundled SVG to a PNG in the page, hands that image
to Notion's existing custom-image paste handler or upload input, and clicks
Notion's own Save button once Notion enables it.

Your clipboard is never read and never replaced. Notion receives the image and
stores it under your own account, subject to
[Notion's privacy policy](https://www.notion.so/Privacy-Policy-3468d120cf614d4c9014c09f6adc9091).

Opening an icon's licence link navigates to that upstream website, at your
explicit request.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | The three keys above |

No host permissions, no API keys, no tokens, no remote code. Everything that
executes ships inside the package.

## Contact

Open an issue at <https://github.com/arhunsaday/notion-more-icons/issues>.
