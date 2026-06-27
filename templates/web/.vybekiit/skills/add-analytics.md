# Skill: add-analytics

**Goal:** the builder can see who uses their app — visitor stats in plain language.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You wire analytics; the builder never sees provider dashboards
unless you screen-share a summary.

> (Under the hood — agent-only) Wire Plausible or PostHog via env + a small script tag or SDK stub.
> Never name the provider to the builder — say "visitor stats". Replace dashboard analytics placeholder
> (`TODO(vybekiit): … — skill: add-analytics`).

## Steps

1. **Explain in one line.** *"I'll set up visitor stats so you can see how many people use your app."*

2. **Pick a provider and collect one value.** Choose Plausible (simple) or PostHog (richer) based on
   needs — default Plausible for v1. Ask the builder to create an account if needed; collect the site
   id / project key **one at a time** into the secret settings file.
   **Verify:** key saved.

3. **Wire the snippet.** Add the tracking script to the app layout (web) or equivalent entry point.
   For mobile/extension, wire through the backend or a minimal client event if applicable.
   **Verify:** build succeeds; no console errors on load.

4. **Confirm data flows.** Open the app once yourself; check the provider dashboard shows at least one
   visit (or use their test/debug mode).
   **Verify:** at least one event recorded. 🎉 *Celebrate* — they can see visitor stats.

5. **Optional dashboard link.** Add a plain "View stats" link in the builder dashboard that opens the
   provider UI — only if they asked for easy access.

## If anything breaks

Run `doctor`. Common cause: wrong site id or ad blockers in dev — test in a normal browser window.

## Definition of done

Visitor stats record at least one page view, and the builder knows where to check numbers in plain words.
