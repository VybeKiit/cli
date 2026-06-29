# seo-vybekiit

Use `resolveSeoProvider()` from `@vybekiit/seo` — see package README and ADR-0012.

Canonical GEO/SEO patterns: `docs/positioning/seo-geo-plan.md` (maintainer repo).

## Buyer app wiring

| Surface | Location |
|---|---|
| Metadata + OG | `src/lib/seo.ts` → `buildPageMetadata()`, `buildBlogGeo()` |
| JSON-LD | `src/components/vybe-json-ld.tsx` + `buildJsonLdBlogPosting()` / `buildJsonLdFaq()` |
| llms.txt | `app/llms.txt/route.ts` → `buildLlmsTxt()` |
| Sitemap | `app/sitemap.ts` — static paths + CMS blog slugs |
| Internal links | `suggestInternalLinks(hub, spokes)` — hub `/blog`, spokes per post |

## GEO / answer-engine optimization

Structure pages so ChatGPT, Perplexity, Claude, and Google AI Mode can cite them:

1. **Answer-first** — direct answer in the first 100–150 words before elaboration.
2. **FAQ blocks** — natural-language H3 questions; emit `FAQPage` JSON-LD via `buildJsonLdFaq()`.
3. **Article posts** — `type: 'article'` metadata + `BlogPosting` JSON-LD on `/blog/[slug]`.
4. **llms.txt** — curated page list at `/llms.txt`; pointer to `/llms-full.txt` for extended docs.
5. **Hub-spoke links** — blog index links to every post with keyword-rich anchors (not "click here").
6. **Open Graph** — `buildOpenGraph()` + `toNextMetadata()` for share cards and crawler context.

## Maintainer landing only (not buyer template)

- Bing / Brave Webmaster submission — manual, Wave B.
- Neutral competitor `/compare` spoke pages — marketing content on `apps/landing`.
