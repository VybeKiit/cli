# Skill: add-blog

**Goal:** the builder wants a blog or changelog on their site.

> (Under the hood — agent-only) `@vybekiit/cms` + `@vybekiit/seo` via `cms-client.ts` and `seo.ts`.
> Content lives in `content/*.mdx`; routes under `app/[locale]/blog/`; sitemap via `app/sitemap.ts`;
> GEO via `app/llms.txt/route.ts`, `VybeJsonLd`, and `buildBlogGeo()`.

## Steps

1. Explain: *"I'll add blog pages you can edit as simple files."*
2. Add MDX pages under `content/` (title from `#` heading; optional description in front matter).
3. Blog index at `/blog` lists pages via `getCms().listPages()`; each post at `/blog/[slug]`.
4. Wire page metadata with `buildPageMetadata()` or `buildBlogGeo(slug)` → Next `Metadata` + Open Graph.
5. Add `<VybeJsonLd data={...} />` on each post — `buildJsonLdBlogPosting()` for articles; `buildJsonLdFaq()` when the post has an answer-first FAQ block.
6. After adding pages, confirm `/llms.txt` lists new `/blog/*` URLs (`buildLlmsTxt()` in `app/llms.txt/route.ts`).
7. Hub-spoke internal links: link from `/blog` to each post with descriptive anchors (`suggestInternalLinks()` — keyword anchors, never "click here").
8. **Verify:** blog index and post render; view-source shows JSON-LD; `/llms.txt` returns 200 with new paths; sitemap includes `/blog` and post slugs.

## Definition of done

At least one blog page is live, listed in the sitemap, cited in `/llms.txt`, and carries JSON-LD on the post page.
