# Skill: onboarding

**Goal:** take the builder from "I just bought this" to **their app running and visible in front of
them** in this one session. This is the keystone — the moment that proves the purchase was worth it.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. **Welcome + ask the one thing that matters.**
   Greet warmly. Ask: *"In one sentence, what do you want to build?"* Use their answer to tailor the
   starter page later — don't turn it into a technical interview.

1b. **One-time planning offer** (skip if `.vybekiit/state/planning-intro-seen` exists).
   Ask: *"Before we start building — want to **think it through together** first? I'll ask one question
   at a time until we're totally aligned. Or we can jump straight to building."*
   - **Yes** → run `plan-my-idea.md` with their one-sentence answer as seed; when done, continue to
     step 2.
   - **No** → continue to step 2.
   Create `.vybekiit/state/planning-intro-seen` (any content) so this offer never repeats.

2. **Set up the tools, then get the preview running.**
   First run `vybekiit doctor` — it installs the tools the app will need (for the database and for
   putting the app online) so the builder never configures anything. It may say a tool "isn't signed
   in yet" — that's fine for now; sign-in happens later, only when a step needs it (one browser click
   each). Then install the project's building blocks and start the app yourself, in plain words.
   After dependencies install, run **quality smoke** yourself: `pnpm verify` (format, lint, typecheck,
   tests). Confirm `.cursorignore` hides `.env` (doctor checks this). Optionally install UI walkthrough
   browsers: `pnpm exec playwright install chromium` (agent-only — see `playwright-vybekiit.md`).
   Fix anything red before showing the preview. The builder hears: *"Everything checks out."*
   **Verify:** the dev server is up with no errors. If it fails → run `doctor`.

   > (Agent-only) **Database MCP tier:** Supabase, Neon, and Firebase use login-once MCP configs
   > (`mcp-supabase.json`, `mcp-neon.json`, `mcp-firebase.json`) — merge via `agent/mcp-setup.md`
   > (Cursor, Claude Desktop, Codex). MongoDB and AWS are advanced only.
   >
   > **Payment MCP tier:** Stripe and PayPal use `mcp-stripe.json` / `mcp-paypal.json` when
   > `setup-payments` runs — same merge guide.

3. **Show them their app.**
   Give them the one link to open (`http://localhost:3000`) and tell them what they'll see.
   **Verify:** ask them to confirm they can see the page. Don't continue until they say yes.
   🎉 *Celebrate* — their app is alive.
   Mention Report mode once: *"If something looks wrong, press Option+Shift+R (Alt+Shift+R on
   Windows), click it, tell me what's off — I'll get the details automatically."*

4. **Make it theirs.**
   Edit the starter page to reflect the one sentence from step 1 (headline + intro). Keep it simple.
   **Verify:** the preview updated; they confirm it looks like their idea.

5. **Offer the next goal.**
   Ask what they want next and route via `goal-index.md`:
   - take money → `setup-payments`
   - put it online for real → `go-live`
   - let people sign in → `add-signin`
   - save their data → `save-data`
   - save progress online → `back-up-my-code` (optional nudge after meaningful progress)

## If anything breaks

Stop the steps and run `doctor`. Never show a raw error — say what happened and the one fix.

## Definition of done

The builder has seen their own app running and personalized, and knows the next thing they can ask
for. Save progress for them (don't make them think about it).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

