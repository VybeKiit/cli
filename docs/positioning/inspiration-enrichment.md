# Landing inspiration enrichment

> ChatGPT review (via ai-browser-bridge) merged with implementation status.
> Source prompt: per-slug enhancement + A/B ranking for vybekiit.com.

## Direction review

| Slug | Specific enhancement | Why it works for agent-as-operator |
|------|---------------------|-----------------------------------|
| `terminal-to-live` | Agent execution rail: each command → plain-English outcome; final line animates into a clickable URL chip | Shows the agent doing real operational work, not just chatting about code |
| `split-screen` | Left: chaotic “builder alone” stack (crossed tabs, env vars, errors). Right: calm timeline Describe → Agent builds → Payments live | Makes the value obvious: VybeKiit replaces scattered developer chores with one operator flow |
| `three-platform` | Bundle unwrap: one $29 box opens into three cards — Web, Mobile, Extension — each stamped “agent-ready” | Frames VybeKiit as one purchase that gives the agent multiple shipping targets |
| `receipt-mor` | Invoice hero where confusing tax rows collapse into one green line: “Merchant of Record handled” | Positions the agent as the operator that handles boring business infrastructure |
| `directors-chair` | Large instruction card (“booking app for dog groomers”) + agent storyboard scenes below | Reinforces: the user directs, the agent executes |
| `checklist` | Verify-before-advance: each step unlocks after a green “tested” stamp | Makes the agent feel reliable — proves work before moving forward |
| `vibe-coder` | Oversized natural-language prompt as the main visual: “Describe the product like a voice note” | Speaks to non-developers; agent feels accessible as an operator |
| `before-after` | Slider: left “Day 1: idea in notes app”, right “Session 1: live app with payment toast” | Transformation instantly understandable: agent turns intent into a paying product |
| `quiet-stack` | Muted stack layers; highlighted agent path Auth → Database → Payments → Deploy → Updates | Stack exists, but the buyer does not manage it — the agent operates it |
| `bold-statement` | Kinetic headline: “ships itself” cycles to “tests itself”, “updates itself”, “takes payments” | Memorable claim while showing concrete operator duties |

**Implementation:** all ten enhancements are live at `/inspirations/[slug]`. Production hero (`/`) uses the upgraded `AgentSessionDemo` execution rail + URL chip.

---

## Top 3 A/B test picks (ChatGPT)

### 1. `before-after`
Best for conversion — communicates outcome in one glance: idea → live paying app. Strongest for cold traffic because the buyer does not need to understand agents, frameworks, or SaaS kits first.

### 2. `directors-chair`
Strongest brand positioning — buyer’s role instantly clear: you direct, the agent builds. Avoids generic SaaS visuals; memorable mental model for the whole site.

### 3. `checklist`
Best trust-builder — answers “Will this actually work, or will I get stuck?” Verify-before-advance makes the agent feel like an operator with accountability, not a chatbot making promises.

**Run order:** Production hero (terminal-to-live, control+) vs swap hero to `before-after` vs `directors-chair` for brand campaigns vs `checklist` for retargeting/trust traffic.

---

## Production note

Current production hero remains **terminal-to-live** (execution rail). ChatGPT ranked **before-after** #1 for cold conversion — consider an A/B route or `?hero=before-after` switch when analytics are wired.
