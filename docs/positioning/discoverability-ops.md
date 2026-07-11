# Discoverability ops checklist (landing)

Maintainer checklist after shipping SEO/GEO surfaces on `apps/landing`.
Technical surfaces are in code; these are the **human** steps that cannot be automated from the monorepo alone.

## After deploy

1. **Google Search Console** — property for `https://vybekiit.com` → submit `https://vybekiit.com/sitemap.xml`.
2. **Bing Webmaster Tools** — import from GSC or add site → submit same sitemap (feeds ChatGPT browsing paths).
3. **Brave Search** / webmaster if available → submit sitemap (Claude-related discovery path in our plan).
4. **Spot-check live:**
   - `https://vybekiit.com/robots.txt` — allows AI search bots; disallows `/checkout`, `/success`, `/cancel`, `/api/`.
   - `https://vybekiit.com/llms.txt` and `/llms-full.txt`.
   - `https://vybekiit.com/compare` + one alternative + one wedge URL.
5. **Rich results** — Google Rich Results Test on `/` (FAQ + Product) and `/compare`.
6. **IndexNow** (optional) — ping Bing when major GEO pages change.

## Share of Model baseline (monthly)

Run the same 20–30 prompts in ChatGPT, Perplexity, Claude, Gemini, and Google AI Overview. Log: mentioned? linked? factual?

Example prompts:

- best SaaS boilerplate for non-technical founder
- ShipFast alternative for vibe coding
- SaaS boilerplate with web mobile and browser extension
- SaaS starter kit Merchant of Record Lemon Squeezy
- VybeKiit vs Lovable
- vibe coding SaaS template
- best SaaS boilerplate for Claude Code

## Content freshness

- Re-verify rival **prices** before major marketing pushes (matrix note: 2026-06-27).
- Refresh `/compare` and alternative pages when a rival changes model or pricing.
- Add `sameAs` URLs in `brandFacts.ts` when GitHub org / X / Product Hunt go live.
- Add `aggregateRating` / `Review` JSON-LD **only** with real reviews (never invent).

## Code SSOT

| Surface | Location |
|---|---|
| Paths / sitemap / llms index | `apps/landing/src/data/discoverability/catalog.ts` |
| Long-form GEO bodies | `apps/landing/src/data/discoverability/geoPages.ts` |
| FAQ (JSON-LD + EN UI) | `apps/landing/src/data/faq.ts` |
| Schema.org | `apps/landing/src/data/structuredData.ts` |
| Strategy | `docs/positioning/seo-geo-plan.md` |
