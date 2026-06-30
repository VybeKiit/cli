---
name: publish-extension
description: the builder's extension is **listed in the Chrome Web Store** for anyone to install. Use when the builder says something like: put it online; publish; make it live; ship it; deploy; chrome store.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: publish-extension

**Goal:** the builder's extension is **listed in the Chrome Web Store** for anyone to install.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Use `@vybekiit/browser-automation` (`cws` target) + `chrome-extension-vybekiit.md`.
> CLI: `vybekiit-automate cws …` or programmatic CWS verb exports.
> Listing source: `.vybekiit/store/extension/cws-listing.ts`. Never say Chrome Web Store jargon to the builder — say "the extension store."

## Steps

1. **Resolve identity markers.** Fill `TODO(vybekiit): … — skill: publish-extension` in manifest and
   listing files; confirm name, description, icons with the builder.
   **Verify:** re-grep shows no publish markers left.

2. **Backend must be live.** Extension features that need accounts/data/payments require the web app
   online first — run web `go-live` if needed.
   **Verify:** backend URL loads.

3. **Build the store package.** Produce the zip the store accepts.
   **Verify:** build succeeds.

4. **One-time developer account.** Plain words: paid Chrome developer registration; one step at a time.
   **Verify:** account exists.

5. **Submit via automation.** Import or refresh listing from the live store when needed (`vybekiit-automate extension import --json`), edit `.vybekiit/store/extension/cws-listing.ts`, then push (`vybekiit-automate extension update --json`) after verify gate.
   **Verify:** store dashboard shows the submission. 🎉 Celebrate.

## Definition of done

Store listing submitted (or live) and builder has the public install link when approved.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
