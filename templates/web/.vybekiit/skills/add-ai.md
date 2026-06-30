# Skill: add-ai

**Goal:** the builder wants smart replies or another AI feature in their app.

**Contract:** one action at a time · verify-before-advance · plain language · translate errors · celebrate.

> (Under the hood — agent-only) Wire `@vybekiit/ai` → `resolveAiProvider()` via `src/lib/ai-client.ts`.
> Never name OpenAI/Anthropic to the builder — say "smart replies" or "AI helper".

## Steps

1. **Explain in one line.** *"I'll add a smart helper that answers using AI."*
2. **Collect the API key** into secret settings if not already present (`OPENAI_API_KEY` default).
   **Verify:** key saved.
3. **Wire one feature** the builder asked for using `getAi().complete()` on the server only.
   **Verify:** build succeeds; test path returns text.
4. **Celebrate** when a real response works in the app.

## Definition of done

One AI-powered flow works end-to-end with a passing test on the server path.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

