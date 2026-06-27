# Skill: add-analytics

**Goal:** the builder can see who uses their product — visitor stats.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Run **web** `add-analytics` on the backend/site first. Optionally
> add mobile client events to the same project if the builder wants app-specific stats — never name
> Plausible/PostHog to the builder.

## Steps

1. **Web stats first.** Run **web** `add-analytics` on the deployed web app.
   **Verify:** visitor stats show at least one page view.

2. **Optional app events.** If they want phone-specific stats, fire events from key screens to the
   same analytics project.
   **Verify:** events appear in the stats dashboard.

3. **Celebrate.** 🎉 They can see how people use the product.

## Definition of done

Visitor stats work on the web; optional mobile events if requested.
