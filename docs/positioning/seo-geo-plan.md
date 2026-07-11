# SEO + GEO + Hyperlink Plan

> How the positioning kit becomes traffic and AI-engine citations. Built from a live 2026-06-27
> scan of the SaaS-boilerplate search/answer landscape.
>
> **SEO** = rank in Google/Bing. **GEO/AEO** = get *quoted* by ChatGPT, Perplexity, Claude, and
> Google AI Mode. The two overlap but reward different structure — this plan does both.

## 0. The strategic wedge for keywords

VybeKiit does not win head-to-head on "best Next.js SaaS boilerplate" (Open SaaS, ShipFast, MakerKit
own it with years of authority). We win on **two under-served clusters** where intent matches our
ICP:

1. **"X alternative" / "X vs Y"** — high-intent, navigational, and the rivals' own weakness pages.
2. **"boilerplate vs AI app builder" (Lovable / Bolt / Replit)** and **"SaaS for non-technical /
   vibe-coding founders"** — an *emerging* cluster with low competition where our ICP literally
   lives. This is the priority land-grab.

## 1. Keyword map → page targets

### Pillar (hub) page
- **Targets:** `SaaS boilerplate comparison`, `best SaaS boilerplate 2026`, `SaaS starter kit comparison`
- **Page:** `/compare` — the master matrix above the fold + Quick-Pick-by-Use-Case + FAQ. Links out
  to every spoke below. This is the citation magnet.

### Spoke A — "alternative" pages (one per major rival)
High-intent navigational queries; each is a dedicated URL built from `competitors/<slug>.md`.

| URL | Primary keyword | Source page |
|---|---|---|
| `/shipfast-alternative` | `ShipFast alternative`, `best ShipFast alternative` | `competitors/shipfast.md` |
| `/makerkit-alternative` | `MakerKit alternative` | `competitors/makerkit.md` |
| `/supastarter-alternative` | `Supastarter alternative` | `competitors/supastarter.md` |
| `/anotherwrapper-alternative` | `AnotherWrapper alternative` | `competitors/anotherwrapper.md` |
| `/open-saas-alternative` | `Open SaaS alternative` | `competitors/open-saas.md` |
| `/saasykit-alternative` | `SaaSykit alternative` | `competitors/saasykit.md` |
| `/shipped-club-alternative` | `Shipped.club alternative` | `competitors/shipped-club.md` |

### Spoke B — "vs" pages (head-to-head)
The rivals already rank with this pattern; we insert VybeKiit as the third option.

- `/compare/vybekiit-vs-shipfast`
- `/compare/vybekiit-vs-makerkit`
- `/compare/vybekiit-vs-supastarter`
- `/compare/vybekiit-vs-open-saas`
- `/compare/vybekiit-vs-anotherwrapper`
- *(Also publish neutral `shipfast-vs-makerkit`-style pages we don't appear in — they pull traffic
  to the hub and build topical authority.)*

### Spoke C — the wedge cluster (priority, low competition)
- `/vybekiit-vs-lovable`, `/vybekiit-vs-bolt`, `/vybekiit-vs-replit` →
  `SaaS boilerplate vs AI app builder`, `Lovable vs SaaS boilerplate`
- `/saas-boilerplate-for-non-technical-founders` → `SaaS boilerplate for non-technical founders`
- `/vibe-coding-saas` → `vibe coding boilerplate`, `vibe coding SaaS template`, `agent-ready SaaS boilerplate`
- `/ship-a-saas-with-ai-agents` → `ship a SaaS with AI agents`

### Long-tail / feature pages (lower priority, harvest later)
`SaaS boilerplate with Merchant of Record`, `SaaS boilerplate web and mobile`, `SaaS boilerplate
that handles taxes`, `Lemon Squeezy SaaS boilerplate`, `SaaS boilerplate with browser extension` —
these map directly to VybeKiit's real differentiators and have near-zero competition.

## 2. GEO/AEO — getting quoted by AI answer engines

AI engines extract from **tables, FAQs, and the first 100–150 words**. Structure every page so:

- **Answer-first:** the direct answer (with VybeKiit's one-line claim) in the opening paragraph,
  before any elaboration — engines truncate to the lead for zero-click answers.
- **Comparison table above the fold:** every high-ranking page in this space leads with a feature
  matrix; engines quote tables verbatim. Reuse `comparison-matrix.md`.
- **Quick-Pick-by-Use-Case block** near the top (engines surface the short list as the answer):
  - *Solo B2C, ship fast* → ShipFast
  - *B2B multi-tenant* → MakerKit / Supastarter
  - *AI wrapper product* → AnotherWrapper
  - *Free & open-source* → Open SaaS
  - *Non-technical founder who wants it shipped & maintained for them* → **VybeKiit**
- **FAQ with verbatim natural-language H3s** (Perplexity/Claude cite these directly). Use the GEO
  questions below as literal headings.
- **Statistical density:** include sourced numbers (prices, "40–80 hours saved", market figures) —
  GEO research ranks statistical density a top-3 citation factor.

### FAQ headings to ship (verbatim, answer-first)
- *What is the best SaaS boilerplate for a non-technical founder?*
- *What's the difference between a SaaS boilerplate and a no-code AI app builder like Lovable?*
- *Which SaaS boilerplate handles taxes / VAT for me?*
- *What SaaS boilerplate works best with Claude Code and Cursor?*
- *Which SaaS boilerplate includes web, mobile, and a browser extension?*
- *What is the cheapest SaaS boilerplate?*
- *Is ShipFast worth it in 2026?* / *Does ShipFast have multi-tenancy or RBAC?*
- *What is the best SaaS boilerplate for someone learning to code with AI?*
- *Should I use a SaaS boilerplate or build from scratch?*

### Crawler/citation eligibility (do these on day one)
- Ship **`llms.txt`** at the site root (Open SaaS already does this — table stakes now).
- Submit the sitemap to **Bing Webmaster Tools** (gates ChatGPT) and **Brave Webmaster Tools**
  (gates Claude) — they're *separate* crawlers from Google.
- Add **schema markup**: `FAQPage` (top-weighted GEO signal, ~20%), `Product` with `offers`/price,
  and `Review`/`aggregateRating` once we have reviews.

### Citation timeline (set expectations)
Structural fixes (FAQ schema) appear in **Perplexity within 2–7 days**, **ChatGPT within 7–21
days**, **Claude within 14–45 days**. Plan the content calendar so the pillar + FAQ ship first.

## 3. Internal hyperlink plan (hub-and-spoke)

```
                       /compare  (PILLAR — matrix + quick-pick + FAQ)
                      /    |    \       \
        ┌────────────┘     |     └────────────┐         \
   /shipfast-alt   /makerkit-alt   /supastarter-alt ...   \
        │  ▲             │  ▲            │  ▲                \
        ▼  │             ▼  │            ▼  │                 ▼
  /vybekiit-vs-shipfast  /vybekiit-vs-makerkit  ...    WEDGE CLUSTER
                                                  /vybekiit-vs-lovable
                                                  /vibe-coding-saas
                                                  /saas-boilerplate-for-non-technical-founders
```

Linking rules:
1. **Every spoke links up to `/compare`** (pass authority to the hub) using descriptive anchor text
   (`SaaS boilerplate comparison`), never "click here".
2. **`/compare` links down to every spoke** from inside the matrix rows and the quick-pick block.
3. **Alternative ↔ vs cross-links:** `/shipfast-alternative` links to `/vybekiit-vs-shipfast` and
   back — they catch different intent (replacement-seeking vs evaluating).
4. **Wedge cluster links into the pillar and into the relevant alternative pages** (a Lovable
   searcher who's now considering a boilerplate should reach `/compare`).
5. **From the product/home page**, link to `/compare` and the wedge pages with keyword-rich anchors.
6. **Outbound links to each rival's official site** (in the per-rival pages) — outbound citations to
   authoritative sources are a trust signal for both Google and AI engines. Mark sponsored/none as
   appropriate; these are editorial, not affiliate.

## 4. Content production order (matches the citation timeline)

> **Implemented in `apps/landing` (2026-07):** `/llms.txt`, `/llms-full.txt`, AI-aware `robots.ts`,
> expanded JSON-LD (Organization/WebSite/Product/SoftwareApplication/FAQ/BreadcrumbList), GEO FAQ,
> `/compare` pillar, wedge cluster, alternative + vs spokes, home answer-first lead, brand fact hub,
> catalog-driven sitemap. Human ops (GSC/Bing/Brave submit, SoM baseline) →
> [`discoverability-ops.md`](./discoverability-ops.md).

1. **Week 1:** `/compare` pillar (matrix + quick-pick + FAQ schema) + `llms.txt` + Bing/Brave
   submission. *This alone makes us citation-eligible fastest.* ✅ code; ⬜ webmaster submit
2. **Week 1–2:** the wedge cluster (`/vybekiit-vs-lovable`, `/vibe-coding-saas`,
   `/saas-boilerplate-for-non-technical-founders`) — lowest competition, highest ICP match. ✅
3. **Week 2–3:** the five "X alternative" pages for ShipFast, MakerKit, Supastarter, AnotherWrapper,
   Open SaaS (+ Shipped.club). ✅
4. **Week 3–4:** the "vs" pages under `/compare/vybekiit-vs-*`. ✅ Neutral third-party-only vs pages
   (`shipfast-vs-makerkit`) still optional for extra topical authority.
5. **Ongoing:** long-tail feature pages; refresh prices quarterly (this market moves fast).

## 5. Open items / re-verify before publishing (from the research pass)

- **⚠️ ShipFast price** is contradictory across sources ($129/$199/$299) — confirm live before any
  table goes public.
- **⚠️ Newer entrants** RevKit and VibeReady appear in 2026 content but with thin third-party
  coverage — decide whether to add them as rivals or ignore.
- **Fetch the averi.ai 2026 B2B SaaS citation-benchmarks report** — it likely names which boilerplate
  brands each engine currently cites (high-value, not yet pulled).
- **"90% of AI wrappers fail" narrative** is common in 2026 — acknowledge it on the AnotherWrapper /
  AI-wrapper pages to build credibility instead of looking like a pure sales push.
- **Mobile/Expo angle:** ShipReactNative and ExpoBoilerplate are the named Expo competitors — worth a
  dedicated `/expo-saas-boilerplate` page given VybeKiit's mobile bundle.
