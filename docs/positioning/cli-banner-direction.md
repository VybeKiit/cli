# VybeKiit CLI welcome banner — art direction brief

Use this when generating **terminal banner concept images** (not final ASCII yet).

## Product context

- **Command:** `vybekiit setup` — first post-purchase CLI entry after buying VybeKiit ($29 SaaS kit).
- **Audience:** semi-technical **vibe coder** — describes apps to an AI agent; does not want to learn dev plumbing.
- **Brand mark:** three stacked chevrons (like `>>>` layers) — same shape as the landing `VybeBrandMark` SVG.
- **Palette:** dark terminal bg `#0B0E14`, shimmer accent cyan `#22D3EE` → violet `#A78BFA`.
- **Motto (must appear readable in mockup):** *Ship SaaS and projects like a software engineer — without becoming one.*

## What we are generating

**Concept images only** — screenshots/mockups of how the welcome banner *could* look in a macOS Terminal or iTerm window when someone runs `vybekiit setup`.

Later we convert the chosen direction into **pure ASCII + ANSI shimmer animation** (12 frames, ~80ms each). So concepts must be **achievable in monospace**:

- Max width ~60–72 columns
- No photographic elements inside the “ASCII” art itself
- Prefer block chars, slashes, pipes, dots, `#`, `█`, `▓`, `░`, box-drawing
- Shimmer = moving gradient highlight across letters/logo (show as one still with gradient visible, or 2–3 subtle variants in one image)

## Do NOT

- Lorem ipsum or fake code dumps dominating the frame
- Overly complex figlet that would be illegible at 12px line height
- Photorealistic logos (must read as terminal text art)
- Light/white terminal themes (dark only)

## Label each image corner

Small monospace label: `Direction N — <slug>`
