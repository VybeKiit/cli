# Platform skills — extension template (agent-only)

Layer B execution knowledge. Chrome Extension API docs are source of truth — no custom WXT skill yet.

## Official upstream

- Chrome Extension APIs: https://developer.chrome.com/docs/extensions
- Manifest V3: https://developer.chrome.com/docs/extensions/mv3/intro/
- Chrome Web Store: https://developer.chrome.com/docs/webstore
- WXT (framework): https://wxt.dev — reference only in wrapper until official skills exist
- Publish automation: `@vybekiit/browser-automation` (`extension` / `cws` domain)

## Wrapper index

| Wrapper | Invoked by buyer skill |
|---|---|
| `chrome-extension-vybekiit.md` | all extension work + `publish-extension` |
| `code-hygiene-vybekiit.md` | generic coding (invisible) |
| `planning-vybekiit.md` | `plan-my-idea` |
| `observability-vybekiit.md` | generic coding + `track-errors` |
| `sentry-vybekiit.md` | `track-errors` |
| `ui-consistency-vybekiit.md` | generic UI work |
| `testing-vybekiit.md` | generic coding (invisible) |
| `format-lint-vybekiit.md` | generic coding (invisible) |
| `react-patterns-vybekiit.md` | generic coding (invisible) |
| `responsive-vybekiit.md` | popup / options UI layouts |
| `github-vybekiit.md` | `back-up-my-code` |
| `playwright-vybekiit.md` | UI walkthrough (when scaffold ships) |
| `ci-vybekiit.md` | push / PR flow (invisible) |
| `ship-via-pr-vybekiit.md` | save progress |
| `i18n-vybekiit.md` | generic UI / `add-language` | Chrome `_locales/` + `lib/i18n.ts` |
| `env-secrets-vybekiit.md` | secret handling |
