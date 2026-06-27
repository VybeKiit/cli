# NAMING.md — CWS Automation

Root naming rules live in `../../NAMING.md`. This file only adds package-local rules.

## Use / Avoid

| Use | Avoid |
|---|---|
| CWS verb | command, action |
| read verb | scrape command |
| push verb | deploy command |
| listing source | CWS config, listing data |
| listing drift | mismatch, stale CWS |
| attached session | browser session, profile |
| selector registry | selectors file |
| safe click | click helper |

## Naming Rules

- Name verb files after the verb: `readReviewStatus.ts`, `updateListing.ts`, `uploadPackage.ts`.
- Keep CWS mutating functions under `src/verbs/*`.
- Use `read*` for read-only verbs and imperative names for push verbs.
- Use `Cws*` type names for Chrome Web Store domain shapes.
- Use `listing*` names for store listing state, not generic `data` or `payload`.
- Do not call a CWS upload "publish"; upload, submit for review, and publish are separate states.
- Do not add destructive verb names without updating ADR-0012 first.

