# Skill: publish-extension

**Goal:** the builder's extension is **listed in the Chrome Web Store** for anyone to install.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Use `@vybekiit/extension-publish` + `chrome-extension-vybekiit.md`. Listing source:
> `cws-listing.ts`. Never say Chrome Web Store jargon to the builder — say "the extension store."

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

5. **Submit via automation.** Run extension-publish push verbs after verify gate.
   **Verify:** store dashboard shows the submission. 🎉 Celebrate.

## Definition of done

Store listing submitted (or live) and builder has the public install link when approved.
