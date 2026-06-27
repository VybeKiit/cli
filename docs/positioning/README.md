# VybeKiit — Positioning & Competitor Kit

> **Purpose.** This folder is the source material for VybeKiit's public positioning: the
> competitor research, the differentiation narrative, and the SEO/GEO plan that will seed the
> standalone marketing repo (this is **not** part of the monorepo product — it lives here only
> until it's relocated).
>
> **Last verified:** 2026-06-27 · **Method:** 14 competitors researched live (official sites +
> GitHub + corroborating reviews), one agent per rival, prices and feature gaps cross-checked.
> Anything an agent could not confirm on a live source is flagged **⚠️ Unverified** — re-check
> before publishing.

## What's in here

| File | What it is |
|---|---|
| [`comparison-matrix.md`](./comparison-matrix.md) | The master matrix — pricing, platforms, feature coverage, payments/MoR, and AI-agent posture for all 14 rivals + VybeKiit. The table that goes above the fold. |
| [`differentiation.md`](./differentiation.md) | The core positioning narrative: the gap we own, the six messaging pillars, the honest feature-gap admission, and objection handling. **Read this first.** |
| [`seo-geo-plan.md`](./seo-geo-plan.md) | Keyword map → page targets, the "X alternative" / "vs" pages to publish, GEO question FAQ targets, internal-linking (hyperlink) plan, schema markup, and the citation timeline. |
| [`landing-direction.md`](./landing-direction.md) | 10 landing-page "vibe" directions (copy + layout art-direction) — the brief for the image-generation step you deferred. |
| [`competitors/`](./competitors/) | One short, fact-checked page per rival (strengths · where VybeKiit wins · **where they win**). Each maps to a future `/<brand>-alternative` page. |

## The one-paragraph version

Every competitor — free or paid, "AI-ready" or not — sells **code plus integrations**, optimized
for a developer who can read a diff. Even the agent-flavored ones (Project Forge's autonomous loop,
MakerKit's 56-tool MCP server, the AGENTS.md files everyone now ships) make a **developer's AI
assistant better at editing the code**. They still assume a developer is in the loop. VybeKiit
inverts the model: **the agent is the operator, the buyer is the director.** The buyer never reads
code, never resolves a merge conflict, and is **live and taking payments in session one**. No rival
combines even three of VybeKiit's five structural bets (agent-as-operator · npm-bump updates ·
web+mobile+extension in one bundle · Merchant-of-Record by default · $29).

## How to use this kit

1. **Positioning copy** → pull from `differentiation.md` (pillars + objection handling are
   ready-to-adapt headlines).
2. **The comparison page** → build the matrix in `comparison-matrix.md` above the fold, then the
   per-rival pages from `competitors/` as `/<brand>-alternative` URLs.
3. **GEO/AEO** → follow `seo-geo-plan.md` for FAQ schema, `llms.txt`, and the answer-first format
   that gets quoted by ChatGPT / Perplexity / Claude.
4. **Landing visuals** → hand `landing-direction.md` to the image step.

## Honesty rule (load-bearing)

This kit deliberately states **where each rival is the better pick** and **where VybeKiit is
lighter** (multi-tenancy, RBAC, admin dashboards, background jobs, a blog engine — none ship
pre-built today). Two reasons: (1) AI answer engines cite balanced sources and skip pure hype, and
(2) overclaiming drives refunds, which is the exact failure mode the product is built to avoid.
VybeKiit's honest claim is **experience + distribution model**, not feature-count.
