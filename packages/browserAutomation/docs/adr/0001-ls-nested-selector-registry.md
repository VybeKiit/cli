# ADR-0001: LS nested selector registry and four-probe-product discovery

**Status:** Accepted  
**Date:** 2026-06-29  
**Context:** `@vybekiit/browser-automation` — Lemon Squeezy product editor automation

## Problem

The LS product editor exposes dozens of controls across pricing types, uploads, settings, confirmation modal, and email receipt. A flat 14-key registry (`product.pricingSingle`, `product.saveDraftButton`, …) could not express per-pricing-type panel fields, could not distinguish two file inputs (media vs files), and broke when Lemon Squeezy renamed or rescoped UI copy.

Runtime verbs threw `SelectorMissingError` on the first stale entry with no recovery path.

## Decision

1. **Nested field keys** — Dot-separated taxonomy grouped by editor area, e.g. `product.pricing.subscription.intervalSelect`, `product.files.uploadInput`.
2. **Registry-first runtime with fallbacks** — `lsField(page, key)` tries `registry.generated.ts`, then `LS_FIELD_FALLBACKS` (text/role/label/css/file index).
3. **Four probe products** — One E2E run creates four `vybekiit-probe-*` products (single, subscription, lead magnet, pay-what-you-want). The single-payment product receives a full editor scroll (media + files upload, variants, settings, confirmation, email receipt); the other three focus on pricing-panel snapshots after card selection.
4. **Domain SSOT under `src/domains/payments/ls/`** — Shared dashboard helpers (`clickSectionCreate`, `waitForDialogInputs`, `fieldLocator`) live in `dashboard/`; probe classification hints live in `selectors/hints.ts`. Dev recorder imports from src — no duplicated hint maps.

## Consequences

**Positive**

- Verbs and probe share one field list (`LS_DRAFT_FIELDS`) and one hint map.
- Fallbacks absorb minor LS UI drift without failing `ls setup` immediately.
- Per-pricing-type fields are discoverable without clicking all four models in one product session (which hides prior panel DOM).

**Negative / trade-offs**

- **Breaking rename** — Existing flat registry keys are invalid; regenerate via `recorder:ls probe-e2e`, do not hand-merge.
- **Four products to clean up** — Requires `--cleanup` or `probe-e2e cleanup` and the `vybekiit-probe-*` prefix convention.
- **Fallback ambiguity** — `text=Subscription` can match nav outside the editor; fallbacks scope under section headings (`Pricing`, `Confirmation modal`) and probe verifies on `/products/\d+` URLs.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Single probe product, click all four pricing cards in sequence | Later panels replace earlier DOM; subscription/PWYW fields not reliably present in one snapshot pass |
| Flat keys with suffixes (`product.pricingSubscriptionInterval`) | Hard to group mentally; no shared namespace for shared panel fields |
| Fallback-only (no registry) | Loses verified Playwright entries from live DOM; harder to audit selector freshness |
| Hand-maintain registry without probe | Does not scale to ~30 keys; drifts from production UI |

## References

- Field list: `src/domains/payments/ls/selectors/fields.ts`
- Runtime: `src/domains/payments/ls/dashboard/fieldLocator.ts`
- Probe: `dev/recorder/shared/probe/runE2e.ts`, `e2eProductFlow.ts`
