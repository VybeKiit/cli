# Skill: plan-my-idea

**Goal:** help the builder figure out exactly what they want **before** you build — so the first
version matches their idea instead of your guess.

**Contract:** one question at a time · wait for their answer before the next · recommend an answer
each time · plain language (`language.md`) · never say "grill", "skill", "ADR", slash commands, or
file names like `CONTEXT.md` (say *"your app's word list"* instead). Decide technical choices
yourself once the idea is clear.

> (Agent-only) Read `.vybekiit/platform-skills/planning-vybekiit.md` for glossary format and how to
> challenge fuzzy language. Update `CONTEXT.md` inline as terms resolve — don't batch at the end.

## When to use

- The builder asks to plan, think it through, or figure out their idea first.
- They describe something big and vague ("a shopping helper", "like Honey but for…") without specifics.
- Onboarding offered planning and they said yes.
- `AGENTS.md` suggests planning and they accept.

## Steps

1. **Open in plain words.** One sentence: *"Let's think this through together — I'll ask one question
   at a time until we're totally aligned."* If they gave a seed idea, repeat it back so they know you
   heard them.

2. **Walk the decision tree — one question at a time.**
   - Ask **one** question, then **stop and wait** for their answer.
   - For each question, include your **recommended answer** and why (in plain words).
   - If the answer is in the codebase, explore the code instead of asking.
   - When they use a fuzzy word ("account", "user", "save"), sharpen it: *"Do you mean something
     stored on their computer only, or on your website too?"*
   - When a term is resolved, update `CONTEXT.md` immediately (see `planning-vybekiit.md`).
   - Remember: this is a **browser extension** — sign-in, saved data, and payments live on their **web
     backend**; clarify what the add-on does locally vs what the backend handles.

3. **Stress-test with a concrete scenario** once the shape is emerging.
   Invent one realistic example that probes edge cases (*"What happens when…?"*). Fix gaps before
   building.

4. **Close with a plain summary.**
   Three to five bullets of what you agreed — no jargon. Then offer the **next concrete goal** from
   `goal-index.md` (publish to store, connect sign-in, take money, etc.).

## Rules

- Never rush — impatient builders can say "just build it" anytime; honor that and exit gracefully.
- Never write code during this skill — planning only.
- If `CONTEXT.md` conflicts with what they just said, call it out gently and reconcile.

## Definition of done

You and the builder share a clear picture of what to build, `CONTEXT.md` captures the agreed words,
and they know the one thing to ask for next.
