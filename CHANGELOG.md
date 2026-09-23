# Changelog

All notable changes to Noticon. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-09-23

First release under the name **Noticon** (previously "Notion Icons Plus"), and
the first build intended for the Chrome Web Store and Firefox Add-ons.

### Added

- Brand identity: generated icon set at 16/32/48/128, vector source, and store
  promo tiles, all produced by `npm run brand` and `scripts/store-assets.mjs`
  with no native image dependency.
- Notion's colour palette in a proper colour popover — ten swatches, a hex
  field and a colour well — replacing six hard-coded swatches.
- Saved, Recent, colour and collection filter now persist between sessions.
- Bookmark button on every icon tile, so saving no longer requires a preview.
- Copy SVG from the preview bar.
- Infinite scroll, with the existing button kept as the keyboard route.
- Skeleton placeholders while a page of results loads.
- Reassignable browser command for the library shortcut, alongside the
  existing Alt+Shift+I handler.
- Curated set of 155 suggested icons on open, instead of 26 followed by
  alphabetical noise.
- Thirty more search synonyms aimed at how pages are actually named
  (`roadmap`, `okr`, `hiring`, `security`, `analytics`, …).
- Batched icon lookup, so Saved and Recent resolve in one message instead of
  one per icon.
- Tab labels recognised in Spanish, German, Portuguese, Italian and Korean, on
  top of English, French, Japanese and Chinese.
- Full CI and a tag-driven release pipeline that publishes to both stores.
- `LICENSE` (MIT), `CHANGELOG.md`, `store/listing.md`, `store/smoke-test.md`
  and `store/DEPLOY.md`.

### Changed

- The panel is rebuilt on Notion's own surface tokens — radii, dividers, field
  treatment, popup shadow and both theme palettes — so it reads as part of the
  product rather than a guest inside it.
- The injected tab copies its typography and spacing from the sibling tab next
  to it, and re-copies them when the theme changes, instead of hard-coding a
  size that goes stale whenever Notion restyles the popup.
- Applying an icon now shows a confirmation flash before the panel closes,
  rather than vanishing with no evidence anything happened.
- The panel follows Notion's light/dark switch while it is open.
- Dark mode only puts a light plate behind icons that are genuinely
  dark-on-transparent, rather than behind every colour icon.
- Roving tabindex in the grid: it is one tab stop, navigated with arrows.
- Empty states explain themselves and offer to reset the filters.
- Errors offer a retry instead of stranding the panel.
- The toolbar popup is branded, reports the real shortcut binding, and links to
  the browser's shortcut settings.
- Version is injected from `package.json` at build time; the manifest keeps a
  `0.0.0` sentinel so the two cannot disagree.

### Fixed

- **Applying an icon reported failure on current Notion.** The upload waited
  for a Save button and treated its absence as an error — but today's Upload
  tab applies a page icon immediately and shows no Save at all, so uploads that
  had in fact worked came back as “Notion did not accept the image paste”.
  The upload now reports what actually happened: *saved* (Notion asked for a
  confirming Save), *applied* (Notion took the image and dismissed its menu),
  or *sent* (the file was delivered and Notion said nothing either way). Only
  the last leaves the panel open, with the manual route to hand — it is
  reported as neither success nor failure, because it is neither.
- If Notion exposes no file input and ignores the paste, the upload button is
  pressed and the click it makes on its own file input is cancelled, which
  keeps the operating system's file chooser shut while still letting the file
  be handed over. The paste is tried first precisely because it has no such
  side effect.
- Recognises more file-chooser labels (“Choose a file”, “Browse”, “Select an
  image”, and their translations), with a loose fallback inside the already
  identified upload panel.
- **The injected tab's underline bent around its own rounded corners**, reading
  as a bracket rather than as Notion's straight rule. It is now a separate
  square-cornered element inset to match the native underline exactly.
- **The tab's colour no longer goes stale.** Idle and selected colours are read
  from the native tabs — with three of them, the idle colour is the one that
  appears twice — so the tab is correctly dim when closed and lit when open, in
  either theme.
- **Two tabs no longer look selected at once.** While the panel is open,
  Notion's own selected tab is faded with an inline opacity, which carries to
  whatever its underline is made of and is removed again on close.
- Markup is no longer assigned through `innerHTML` anywhere in the content
  script, which Notion's Trusted Types policy refuses.
- A stale saved icon id no longer fails the whole Saved view.
