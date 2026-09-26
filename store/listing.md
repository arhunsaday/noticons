# Store listing copy — Noticons

Source of truth for both store listings. Keep in step with `README.md`,
`PRIVACY.md` and `extension/manifest.json`.

---

## Name

**Noticons — more icons for Notion** (32 characters; Chrome allows 75, AMO 50)

Short name: `Noticons`

## Summary / short description

> 39,000+ offline icons inside Notion's own page-icon menu: emoji, colour, logos, duotone. No account, no tracking.

_(113 characters; Chrome's limit is 132.)_

## Category

- Chrome Web Store: **Workflow & Planning**
- Firefox Add-ons: **Productivity**, tags `notion`, `icons`, `productivity`

## Full description

Notion gives you emoji and a small icon set. Noticons adds 39,819 more, in the
same place you already look for them.

Click a page icon, choose **More icons**, and search. Click once — the icon is
applied. That is the whole flow.

Features:

• 39,819 icons across 18 collections, filtered by Colour, Emoji, Brands,
Duotone or Simple.
• 15,838 full-colour icons: Twemoji, Fluent Emoji Flat, Streamline Emojis,
Flat Color Icons, Fluent UI System Color, Streamline Ultimate Color,
Material Icon Theme, Catppuccin and Circle Flags.
• 8,130 emoji in three drawing styles, applied as real images rather than
characters, so they look the same everywhere.
• Brand and product logos in their real colours: GitHub, Figma, React, AWS,
Slack, Docker, Python and thousands more, from Logos, Devicon and Skill
Icons.
• 4,462 duotone icons — Solar, Duoicons and Phosphor's duotone weight — that
still take a colour.
• Country flags that answer to their country's name, not just its ISO code.
• Clean line icons from Lucide, Tabler and Phosphor when a page wants
something quieter.
• Tint any line or duotone icon with Notion's own ten text colours, or any
hex code.
• Fuzzy search that survives typos, and synonyms for the way people actually
name pages: search "roadmap", "okr", "hiring", "security", "budget".
• Save the icons you reuse, and pick from your recents.
• Right-click any icon to preview it, copy its SVG, or download a transparent
280 × 280 PNG.
• Full keyboard control, and a shortcut (Alt+Shift+I) you can reassign.
• Follows Notion's light and dark themes as you switch them.

HOW IT FITS IN

Noticons is not a separate window. It adds one tab beside Emojis, Icons and
Custom, styled from Notion's own controls, and the panel opens underneath them
at the same width. The icon you choose is rasterised and handed to Notion's
normal image upload, which means the icon lives in your workspace: it keeps
working on your phone, for your teammates, and after you uninstall this
extension.

PRIVACY

No accounts. No analytics. No telemetry. No network requests of any kind — the
entire icon catalogue ships inside the extension and searches on your own
machine. The only thing stored is your saved icons, your recents and your colour
choice, in your browser, on your device.

The extension asks for one permission: storage. It requests no access to your
websites beyond Notion's own domains, where it reads only the icon menu's
visible controls.

HONEST ABOUT THE EDGES

Notion can change its interface at any time, and this is an independent
integration rather than an official API. If the tab does not appear, press
Alt+Shift+I or use the toolbar button. If an upload does not go through, preview
the icon and download the PNG instead. The extension never tells you Notion
saved something merely because it handed over a file.

Not affiliated with, endorsed by, or sponsored by Notion Labs, Inc.

---

## Chrome Web Store — Privacy practices

Paste each block into the matching field. Chrome counts the `content_scripts`
match patterns as **host permissions**, which is what triggers the “may require
an in-depth review” notice — there is no way to keep the feature and avoid the
notice, only to make the reviewer's job quick.

### Single purpose

> Noticons adds a searchable icon library to Notion's own page-icon menu. It
> adds one tab beside Notion's Emoji, Icons and Upload tabs; choosing an icon
> from it sets the page's icon. That is the extension's only function.

### Permission justification — `storage`

> Stores the user's own preferences on their device: the icons they have saved,
> the icons they have recently applied, and their chosen icon colour. These are
> three keys holding short icon identifiers such as `lucide:heart`, nothing
> more. No browsing data, page content or personal information is stored, and
> nothing is transmitted anywhere.

### Host permission justification

> The extension's function is to add a tab inside Notion's page-icon menu, so it
> must run a content script on Notion pages. It declares match patterns for
> Notion's six web hosts only — www.notion.so, notion.so, app.notion.so,
> www.notion.com, notion.com and app.notion.com. No other site is matched, no
> wildcard host patterns are used, and no `host_permissions` field is declared.
>
> On those pages the content script reads only the visible controls of the
> page-icon menu: the labels of the Emoji / Icons / Upload tabs, so it can place
> its own tab beside them, and the upload control, so it can hand the chosen
> image to Notion's existing image upload. It does not read page content,
> documents, cookies, form data, credentials or the clipboard, and it makes no
> network requests.
>
> activeTab is not sufficient. activeTab is granted only after the user clicks
> the extension's toolbar button, which is after the moment the tab has to
> already exist inside Notion's menu.

### Remote code

> **No, I am not using remote code.** Everything that executes is in the
> package. The icon catalogue is a set of bundled JSON files read with
> `chrome.runtime.getURL`; there is no `eval`, no remotely hosted script, and
> the extension makes no network requests of any kind.

### What a reviewer can check quickly

- The only `fetch` in the source resolves `chrome.runtime.getURL('catalog/…')` — packaged files, never a URL.
- No `host_permissions`, no `web_accessible_resources`, no `tabs` permission.
- Local storage holds exactly three keys: `favorites`, `recent`, `prefs`.
- Full source: <https://github.com/arhunsaday/notion-more-icons>

## Data-use disclosures

Answer **no** to every "Do you collect…" category: no personally identifiable
information, health, financial, authentication, personal communications,
location, web history, or user activity, and no website content leaves the
device.

Certify all three:

- Not being sold to third parties, outside of approved use cases.
- Not being used or transferred for purposes unrelated to the item's core functionality.
- Not being used or transferred to determine creditworthiness or for lending purposes.

Privacy policy URL: `https://github.com/arhunsaday/notion-more-icons/blob/main/PRIVACY.md`

## Firefox data collection

`browser_specific_settings.gecko.data_collection_permissions.required` is
`["none"]`, which is what AMO now requires an add-on to declare explicitly.
Add-on ID: `noticons@arhunsaday.github.io`.

## Assets

| Asset              | Size                                     | Where it comes from                                                                                                      |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Store icon         | 128 × 128 PNG                            | `extension/icons/icon-128.png` — `npm run brand` ✅ committed                                                            |
| Small promo tile   | 440 × 280 PNG                            | `brand/store/promo-440x280.png` — `node scripts/store-assets.mjs` ⚠️ **stale**                                           |
| Marquee promo tile | 1400 × 560 PNG                           | `brand/store/marquee-1400x560.png` — same script. ⚠️ **stale**. **Optional**: Chrome only uses it for featured placement |
| Screenshots        | 1280 × 800 PNG, at least one, up to five | **Capture by hand** on a real Notion page                                                                                |

Both promo tiles still read "Noticon" and "27,778 icons". They render live text, so
they have to be re-captured on a machine with the project's own fonts — the tiles
committed here came from one, and a headless browser without those fonts produces a
visibly different tile. Run `node scripts/store-assets.mjs` before submitting.

Suggested screenshots, in order:

1. The panel open under Notion's tabs, suggested icons showing.
2. A search in progress (`roadmap` reads well) with results.
3. The colour popover open over a grid of monochrome icons.
4. The same panel in Notion's dark theme.
5. A page with an applied icon, panel closed.

## Licensing note for reviewers

All bundled icon sets are redistributable: MIT (Lucide, Tabler, Phosphor,
Devicon), CC0 (Simple Icons), CC BY 4.0 (Logos), MIT (Fluent Emoji), and the
Good Boy Licence (Flat Color Icons). Full texts ship in `notices/` inside the
package and are linked from each icon's preview in the UI.
