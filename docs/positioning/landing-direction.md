# Landing-Page Vibe Directions (10)

> The brief for the image-generation step you deferred. Each direction is a complete art-direction
> prompt: vibe, layout, palette, type, hero copy, and the proof element. Hand any of these to an
> image model (Higgsfield / Midjourney / ChatGPT image), or to a designer, to render a hero mock.
> All hero copy is drawn from `differentiation.md` → the six pillars, so the visuals stay on-message.
>
> **Through-line for every direction:** the hero must make one thing instantly legible — *you
> describe it in plain language; the agent ships and maintains a real, paying product.* Show the
> **agent operating**, not code.

Shared constraints to paste into any prompt: `landing page hero section, desktop 16:9 and mobile
9:16 variants, high contrast, accessible text sizes, real UI not lorem-ipsum, no stock-photo people,
RTL-aware layout (mirror-safe), space for a single primary CTA button`.

---

### 1. Terminal-to-Live (developer-credible, but inverted)
- **Vibe:** dark IDE/terminal aesthetic — but the "terminal" shows **plain-English instructions**,
  not code. Subverts the ShipFast/Project-Forge dev look while staying credible.
- **Palette:** near-black `#0B0E14`, terminal-green accent, one warm CTA (amber/coral).
- **Type:** monospace for the agent's lines, clean sans for headline.
- **Hero:** *"You direct. The agent builds."* Sub: *"Describe your product. It ships — live and
  taking payments — in your first session."*
- **Proof element:** a faux chat where the user types "sell a $9 meal-plan app" and the agent
  replies with a green ✓ checklist (provision → wire payments → deploy → **Live ✓**).

### 2. Split-screen "Them vs Us"
- **Vibe:** literal two-column. Left = a wall of code + a red "merge conflict" badge. Right = a calm
  chat with the agent + a green "Updated ✓" badge.
- **Palette:** left desaturated grey, right brand-vivid (electric indigo + mint).
- **Hero:** *"Boilerplates give developers a head start. VybeKiit gives everyone else a finished
  product."*
- **Proof element:** small caption under each side — left "you resolve the conflict", right "it just
  installs."

### 3. Three-Platform Bundle (the "one purchase" flex)
- **Vibe:** clean product shot — a laptop (web), a phone (mobile), and a browser toolbar (extension)
  floating together, unified by one design-token color system.
- **Palette:** soft gradient (violet → sky), white space, Apple-keynote calm.
- **Type:** large geometric sans.
- **Hero:** *"One purchase. Web, mobile, and a browser extension."* Sub: *"One agent. Zero
  plumbing."*
- **Proof element:** a single price tag — **$29** — bridging all three devices.

### 4. Receipt / "Taxes Handled" (Merchant-of-Record angle)
- **Vibe:** playful flat-illustration of a payment receipt + a passport stamp "VAT handled".
- **Palette:** finance-trust greens + paper-white, friendly not corporate.
- **Hero:** *"Taxes handled. Merchant of Record built in."* Sub: *"Sell worldwide. Never file a VAT
  form."*
- **Proof element:** a globe with little "✓ tax" pins across regions.

### 5. The Director's Chair (metaphor-forward)
- **Vibe:** cinematic. A director's chair + clapperboard; the "crew" is an abstract glowing agent.
  Sells *you direct, it executes*.
- **Palette:** moody studio black + spotlight gold.
- **Hero:** *"You're the director. The agent is the whole crew."*
- **Proof element:** clapperboard reads "TAKE 1 — LIVE."

### 6. Checklist / Verify-Before-Advance (trust through rigor)
- **Vibe:** ultra-clean, a vertical checklist animating to all-green. Emphasizes the
  verify-before-advance contract (the anti-refund mechanism).
- **Palette:** white, single green accent, generous spacing — Linear/Vercel minimal.
- **Hero:** *"It checks every step worked — so you never get silently stuck."*
- **Proof element:** steps "Account ✓ · Payments ✓ · Deployed ✓ · **Live & paid ✓**".

### 7. Vibe-Coder Native (the ICP, literally)
- **Vibe:** warm, creator-desk flat-lay (coffee, sticky notes, a Claude/Codex tab) — speaks to the
  semi-technical vibe coder. Friendly, not enterprise.
- **Palette:** warm cream + peach + one confident purple.
- **Type:** rounded humanist sans.
- **Hero:** *"You can describe it. That's enough."* Sub: *"Built for vibe coders with a Claude or
  Codex subscription."*
- **Proof element:** a speech bubble "make me a booking app" → a live URL chip.

### 8. Before/After Slider (time-to-live)
- **Vibe:** a draggable before/after — "Day 1: an idea" → "Session 1: a live, paying app".
- **Palette:** cool-to-warm transition (slate → sunrise).
- **Hero:** *"Live and taking payments in your first session."*
- **Proof element:** a timestamp ticking from 00:00 to a Stripe/LS "first payment" toast.

### 9. The Quiet Stack (provider-agnostic, calm-tech)
- **Vibe:** minimalist diagram of swappable adapter blocks (payments/auth/data/hosting) clicking
  into one interface — but greyed, "you never see this." Sells *the complexity is hidden*.
- **Palette:** monochrome blueprint + one live accent on the "Live" node.
- **Hero:** *"All the plumbing. None of the plumbing."*
- **Proof element:** a single toggle labeled "the agent picks" over the adapter grid.

### 10. Bold Statement / Anti-Boilerplate (brand-forward, meme-aware)
- **Vibe:** huge typographic poster, almost no imagery. Confident, scroll-stopping, GEO-quotable.
- **Palette:** high-contrast — black bg, one neon (acid-green or hot-magenta).
- **Type:** oversized variable display font, the word "itself" emphasized.
- **Hero:** *"The SaaS kit that ships itself."* Sub: *"$29. Refundable for 14 days. Cancel the
  regret."*
- **Proof element:** a single CTA and a tiny line of trust badges (Lemon Squeezy · 14-day refund ·
  web · mobile · extension).

---

## Picking / testing notes

- **Default recommendation:** render **#1 (Terminal-to-Live)** and **#3 (Three-Platform Bundle)**
  first — #1 disarms the "is this for devs?" question, #3 lands the unique "one purchase, 3
  platforms" flex no competitor can match.
- **For the GEO/landing test:** #10 doubles as the boldest meta-description/hero one-liner and is the
  most quotable.
- **Avoid:** generic dashboard screenshots (every rival uses them) and stock developer photos — they
  collapse our differentiation back into "just another boilerplate."
- When you generate, request **both a 16:9 desktop and a 9:16 mobile** crop per direction, and keep
  the primary CTA in the same position across all ten so A/B tests stay comparable.
