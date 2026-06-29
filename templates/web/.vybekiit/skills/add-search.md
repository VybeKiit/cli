# Skill: add-search

**Goal:** users can search the builder's data in plain language.

> (Under the hood — agent-only) `@vybekiit/search` → `resolveSearchProvider()` via `src/lib/search-client.ts`.

## Steps

1. Explain: *"I'll add search so people can find things quickly."*
2. Wire index on create/update and a search UI calling `getSearch().search(query)`.
3. **Verify:** index + search test green.

## Definition of done

User can search and see matching results.
