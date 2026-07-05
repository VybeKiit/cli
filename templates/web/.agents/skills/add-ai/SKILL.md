---
name: add-ai
description: the builder wants smart replies or another AI feature in their app. Use when the builder says something like: add ai; chatbot; smart replies.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-ai

**Goal:** the builder wants smart replies or another AI feature in their app.

**Contract:** one action at a time · verify-before-advance · plain language · translate errors · celebrate.

> (Under the hood — agent-only) Wire `@vybekiit/ai` → `resolveAiProvider()` via `src/lib/ai-client.ts`.
> Never name OpenAI/Anthropic to the builder — say "smart replies" or "AI helper".
>
> ⚠️ This skill covers one-shot AI (single `complete()` call). If the builder asks for a **chatbot
> or agent loop** (multi-turn with tool-calling), that requires anti-hallucination guards: track
> whether tools were actually called, force a real tool call before accepting any data claim, and
> never let the model describe tool usage without actually invoking the tool. This is out of scope
> for v1 — surface it as a feature request and note the pattern in checklist.md.

## Steps

1. **Explain in one line.** *"I'll add a smart helper that answers using AI."*
2. **Collect the API key** into secret settings if not already present (`OPENAI_API_KEY` default).
   Run `vybekiit apply-preset embeddings` and `vybekiit apply-preset ai_conversations` when chat history
   is needed (`platform-skills/db-presets-vybekiit.md`).
   **Verify:** keys saved; `vybekiit verify-presets embeddings` when presets applied.
3. **Wire one feature** the builder asked for using `getAi().complete()` on the server only.
   **Verify:** build succeeds; test path returns text.
4. **Celebrate** when a real response works in the app.

## Definition of done

One AI-powered flow works end-to-end with a passing test on the server path.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
