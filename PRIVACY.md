# Privacy

Notion Icons Plus performs no analytics, telemetry, external API requests, or
tracking. Search and icon rendering use a bundled offline catalog. Favorites and
recent icon IDs are stored only in your browser's local extension storage.

The content script runs only on notion.so and notion.com (including their www
and app hosts). It reads visible icon-menu controls to add the library entry. It does not
read page content, scrape documents, access cookies, or call Notion's private API.

Choosing Apply converts the selected bundled SVG to PNG and supplies that image
to Notion's existing custom-image paste handler or upload input, then clicks the
native Save button when enabled. It never reads or replaces your clipboard.
Notion handles the upload and
storage under its own account permissions and privacy policy. Opening an icon's
license link navigates to that upstream website, at your explicit request.

Browser permission: storage. No API keys, login tokens, or additional host
permissions are requested. Uninstalling removes the extension's local storage.
