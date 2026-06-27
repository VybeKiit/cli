# @vybekiit/agent-kit

The single source of truth for the **shared** parts of the VybeKiit agent layer.

## What it is

A small, headless package exporting the agent-layer bits that must stay identical
across every template:

- **`CONTRACT` / `renderContract()`** — the canonical five-rule buyer-skill contract
  (① one action at a time · ② verify-before-advance · ③ plain language · ④ translate
  errors to "what happened + the one fix" · ⑤ celebrate progress).
- **`TOOL_VOCABULARY` / `renderToolVocabularyTable()`** — the jargon → plain-language
  map for talking *about the tools themselves* (the assistant, the terminal, MCP,
  rules files…) to a non-technical builder, rendered as a markdown table.
- **`planKitUpdate()` / `UpdatePlan`** — pure logic that, given a buyer's installed
  `@vybekiit/*` versions and the latest published ones, computes which packages have
  a newer version. This is what the `update-kit` skill calls.

## Why it exists

The agent layer is mostly **template-specific** — each template's skills are ~80%
about that template's flow (web deploys vs. store publishing), so the skills stay
**embedded in each template**, not here. But a few pieces are genuinely shared and
must never drift between templates: the contract every agent promises, the words the
builder is allowed to hear, and the rule for safely updating the kit. Those live here,
once, so a change ships in one place instead of being copy-pasted into each template.

## Keep language.md in sync

The "Talking about the tools themselves" table in each template's `language.md` is
the rendered output of `renderToolVocabularyTable()` — same data, one source. The
section is marked with an HTML comment pointing back here; if you edit
`TOOL_VOCABULARY`, re-render and paste the table into both templates' `language.md`.

## Verification

```bash
pnpm --filter @vybekiit/agent-kit typecheck
pnpm --filter @vybekiit/agent-kit test
pnpm --filter @vybekiit/agent-kit build
```
