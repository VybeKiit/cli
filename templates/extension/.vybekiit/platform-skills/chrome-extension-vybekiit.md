# Platform wrapper: Chrome extension (WXT + MV3)

**Agent-only.** Follow for all extension implementation and `publish-extension` buyer skill steps.

## Official upstream (source of truth — prefer over training data)

- Extension platform: https://developer.chrome.com/docs/extensions
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/intro/
- Permissions: https://developer.chrome.com/docs/extensions/mv3/declare_permissions/ — **least privilege**
- Messaging: https://developer.chrome.com/docs/extensions/mv3/messaging/
- Chrome Web Store publish: https://developer.chrome.com/docs/webstore/publish/
- WXT framework docs: https://wxt.dev (scaffold/build only — API facts from Chrome docs)

## Kit wiring

1. Template uses **WXT + shadcn** (shared with web); UI reads `@vybekiit/tokens`
2. Request **minimum host permissions** — default template uses narrow patterns only
3. Sign-in, data, payments: extension calls the builder's **backend web app** (same as mobile) — no secrets in the extension bundle
4. **Google sign-in:** use [`chrome.identity`](https://developer.chrome.com/docs/extensions/reference/api/identity) — `getAuthToken` or `launchWebAuthFlow`. OAuth client id in manifest [`oauth2`](https://developer.chrome.com/docs/extensions/mv3/manifest/oauth2/) — never secrets in code
5. Store publish: `@vybekiit/extension-publish` Playwright verbs + listing source in `cws-listing.ts`
6. Follow `packages/extension-publish/CONTEXT.md` for CWS vocabulary

## Verify-before-advance

- Extension loads unpacked in Chrome without console errors
- Permissions match declared manifest only
- After publish verb: listing visible in CWS developer dashboard
