# Lemon Squeezy (`domains/payments/ls/`)

Browser automation for Lemon Squeezy onboarding and product editor flows.

## Glossary

| Term | Meaning |
|------|---------|
| **Product** | Sellable item in the LS product editor (`/products/:id`). |
| **Pricing type** | Single payment, subscription, lead magnet, or pay what you want — each exposes different panel fields. |
| **Probe product** | Temporary `vybekiit-probe-*` product for selector discovery; delete via cleanup. |
| **Orphan probe product** | Leftover `vybekiit-probe-*` after a failed probe run; delete manually in LS dashboard. |
| **Selector registry** | Verified entries in `selectors/registry.generated.ts`, keyed by nested field names. |
| **Registry staleness** | Entry older than 90 days — runtime uses `fieldFallbacks.ts` instead. |
| **Probe pause** | `probe-e2e` create runs gated when LS product limits block creation; `ls setup` unaffected. |
| **Tax category** | Fixed dropdown option set for product tax classification; options live in `selectors/taxCategories.ts`. |
| **Product actions menu** | Three-dot product menu (edit, share, delete, …) opened from the product editor header. |
| **Text hint fallback** | Runtime hint in `dashboard/fieldFallbacks.ts` when registry entry is missing or not visible. |
| **Test catalog** | LS sidebar Test mode ON — products published here are purchasable with test checkouts only. |
| **Live catalog** | Test mode OFF — real charges; used for production launch. |
| **Draft** | Unpublished product editor state — checkout cannot sell draft variants. |
| **Published** | Product saved and visible in the active catalog (test or live); required before checkout works. |
| **Variant id** | LS variant numeric id — this is what `STORE_PRODUCT_ID` must hold (not product id). |

## Layout

```
selectors/fields.ts       — LS_DRAFT_FIELDS (nested keys)
selectors/taxCategories.ts — LS_TAX_CATEGORY_OPTIONS
selectors/hints.ts        — probe classification hints
selectors/registry*.ts    — verified Playwright entries
dashboard/                — shared UI helpers + lsField()
verbs/                    — createProduct, setup, uploadProductFiles, …
api/provision.ts          — webhook + variant listing via REST API
```

See [ADR-0001](../../../docs/adr/0001-ls-nested-selector-registry.md) for nested keys and four-probe-product discovery.
