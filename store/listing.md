# Store listing copy — Noticon

Source of truth for both store listings. Keep in step with `README.md`,
`PRIVACY.md` and `extension/manifest.json`.

---

## Name

**Noticon — more icons for Notion** (31 characters; Chrome allows 75, AMO 50)

Short name: `Noticon`

## Summary / short description

> 39,000+ offline icons inside Notion's own page-icon menu: emoji, colour, logos, duotone. No account, no tracking.

*(113 characters; Chrome's limit is 132.)*

## Category

- Chrome Web Store: **Workflow & Planning**
- Firefox Add-ons: **Productivity**, tags `notion`, `icons`, `productivity`

## Full description

Notion gives you emoji and a small icon set. Noticon adds 39,819 more, in the
same place you already look for them.

Click a page icon, choose **More icons**, and search. Click once — the icon is
applied. That is the whole flow.

WHAT YOU GET

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

Noticon is not a separate window. It adds one tab beside Emojis, Icons and
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

## Permission justifications (Chrome requires one per permission)

| Permission | Justification |
| --- | --- |
| `storage` | Persists the user's own saved icons, recently used icons and colour preference in local extension storage. No browsing data, page content or personal information is stored, and nothing is transmitted. |

**Host permissions:** none requested. The content script is declared against
Notion's own domains only (`notion.so`, `notion.com`, and their `www`/`app`
hosts), which is where the feature exists.

**Remote code:** none. Every byte that executes is in the package. The icon
catalogue is a bundled JSON file; nothing is fetched or evaluated at runtime.

**Single purpose:** adding an icon library to Notion's page-icon menu.

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
Add-on ID: `noticon@arhunsaday.github.io`.

## Assets

| Asset | Size | Where it comes from |
| --- | --- | --- |
| Store icon | 128 × 128 PNG | `extension/icons/icon-128.png` — `npm run brand` ✅ committed |
| Small promo tile | 440 × 280 PNG | `brand/store/promo-440x280.png` — `node scripts/store-assets.mjs` ✅ committed |
| Marquee promo tile | 1400 × 560 PNG | `brand/store/marquee-1400x560.png` — same script. **Optional**: Chrome only uses it for featured placement |
| Screenshots | 1280 × 800 PNG, at least one, up to five | **Capture by hand** on a real Notion page |

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
