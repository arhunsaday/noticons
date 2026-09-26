# Deploying Noticons to the Chrome Web Store and Firefox Add-ons

The pipeline in `.github/workflows/release.yml` publishes to both stores when
you push a version tag. It can only do that once the two store accounts exist
and five repository secrets are set — that part is manual, once.

Full step-by-step instructions, including the one-time account setup and the
review timelines, are in the shared deployment guide.

## Quick reference

### Repository secrets

| Secret | Store | Where it comes from |
| --- | --- | --- |
| `CWS_EXTENSION_ID` | Chrome | The item ID in the developer dashboard URL, after the first manual upload |
| `CWS_CLIENT_ID` | Chrome | Google Cloud OAuth client (Desktop app) |
| `CWS_CLIENT_SECRET` | Chrome | Same OAuth client |
| `CWS_REFRESH_TOKEN` | Chrome | Exchanged once, by hand, for that client |
| `AMO_JWT_ISSUER` | Firefox | addons.mozilla.org → Manage API Keys |
| `AMO_JWT_SECRET` | Firefox | Same page |

Add them at **Settings → Secrets and variables → Actions → New repository
secret**.

### The first release is manual

Both stores need a first submission through their web UI, because that is what
creates the listing the API then updates.

1. `npm run verify && npm run package`
2. Upload `releases/noticons-chrome-v1.0.0.zip` at
   <https://chrome.google.com/webstore/devconsole>, fill the listing from
   [listing.md](listing.md), submit for review.
3. Upload `releases/noticons-firefox-v1.0.0.zip` at
   <https://addons.mozilla.org/developers/addon/submit/distribution>, choose
   **On this site**, fill the listing, submit.
4. Copy the Chrome item ID into `CWS_EXTENSION_ID`.

### Every release after that

```bash
npm version minor        # or patch / major — this also creates the tag
git push --follow-tags
```

The workflow verifies the tag matches `package.json`, runs the full gate,
packages both browsers, publishes to both stores and opens a GitHub Release.

To rehearse without publishing: **Actions → Release → Run workflow**, leaving
*dry run* ticked.

### If something goes wrong

| Symptom | Cause |
| --- | --- |
| `Tag 1.2.0 != package.json 1.1.0` | You tagged by hand. Delete the tag, use `npm version`. |
| Chrome step skipped with a notice | A `CWS_*` secret is missing or empty. |
| Chrome: `PKG_INVALID_VERSION_NUMBER` | That version is already uploaded. Bump again. |
| AMO: `Version already exists` | Same. AMO never allows reuse, even of a rejected version. |
| `git diff --exit-code -- extension/icons brand` fails | Someone edited an icon by hand. Run `npm run brand` and commit. |
