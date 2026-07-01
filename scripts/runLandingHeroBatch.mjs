#!/usr/bin/env node
/**
 * Clean SaaS landing-page image batch for VybeKiit, driven through ai-browser-bridge.
 *
 * One QUEUE item → one ChatGPT turn (image model) → `bridge download` saves the
 * generated PNG into inspiration/landing-clean/output/<id>/.
 *
 * DIRECTION (this rewrite): every item renders ONE complete, minimal, modern SaaS
 * marketing landing page in the restraint of cubic.dev / Linear / Vercel / Stripe —
 * light, lots of whitespace, ONE accent, crisp sans-serif, and a LARGE realistic
 * product-UI screenshot embedded in the hero (the actual app a vibe coder ships).
 * The earlier 40-variant queue art-directed toward mascots, receipts, neon, paper-cut
 * and risograph — which read as busy/illustrated/clip-art. That brief is gone. The
 * ten directions here vary only WITHIN the clean language (accent, theme, layout, and
 * which product screenshot leads), so the whole set stays professional and comparable.
 *
 * Copy stays drawn from the real positioning spine (docs/positioning/differentiation.md
 * + apps/landing/src/data/*). The avatar is the semi-technical *vibe coder*, never a
 * terminal-native developer.
 *
 * Prerequisites:
 *   - ai-browser-bridge built: ../ai-browser-bridge/dist/bridge.js
 *   - ChatGPT signed in once in the bridge profile: `bridge login --provider chatgpt`
 *   - An IMAGE-CAPABLE model selected in that ChatGPT tab (GPT-4o / image tool)
 *   - No tunnel/--tools needed: this is image-only, no local repo tools
 *
 * Usage:
 *   node scripts/run-landing-hero-batch.mjs --dry-run            # print prompts, no browser
 *   node scripts/run-landing-hero-batch.mjs --shared --to 2      # smoke-test the first two live
 *   node scripts/run-landing-hero-batch.mjs --only flagship-minimal
 *   node scripts/run-landing-hero-batch.mjs --shared             # all 10 in one shared chat
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIDGE = process.env.BRIDGE ?? resolve(REPO_ROOT, '../ai-browser-bridge/dist/bridge.js');
const OUT_ROOT = resolve(REPO_ROOT, 'inspiration/landing-clean/output');
const TIMEOUT_SEC = Number(process.env.BRIDGE_TIMEOUT ?? 600);

/**
 * Product truth + the clean-design quality bar pasted into every prompt. The PRODUCT
 * facts are sourced verbatim from differentiation.md (§5 pillars, §8 one-liners) and
 * apps/landing/src/data/* (the real section copy). The QUALITY BAR is the load-bearing
 * part of this rewrite: it forces cubic.dev-grade restraint and an embedded realistic
 * product-UI screenshot, and explicitly bans the illustrated clutter that made the
 * previous batch look amateur. Per-item art direction only varies accent / theme /
 * layout / which screenshot leads — never the minimalism.
 */
const SHARED = `You are designing ONE COMPLETE, modern SaaS marketing LANDING PAGE — the full page top to bottom as a single tall, high-fidelity website design comp. This is a polished web mockup, NOT a photograph, NOT a code editor, NOT an illustration.

QUALITY BAR — match the restraint and polish of cubic.dev, Linear, Vercel, and Stripe:
- Minimal, clean, professional, confident. Lots of whitespace and a calm vertical rhythm.
- A neutral base palette (near-white or, when stated, tasteful near-black) with exactly ONE restrained accent color used sparingly on the CTA, links, and check marks.
- Real, crisp sans-serif typography with a clear size hierarchy and perfect spelling.
- THE VISUAL CENTERPIECE is a LARGE, REALISTIC PRODUCT-UI SCREENSHOT embedded in the hero: the actual SaaS app a non-technical buyer ends up with, rendered inside a clean browser or device frame like a real screenshot — believable sidebar, metric cards, charts, tables, real labels (Stripe / Linear / cubic grade). Crisp and legible, with a soft realistic shadow.
- ABSOLUTELY DO NOT INCLUDE: cartoon mascots or robots, illustrated characters, receipts, passport stamps, neon, glow-heavy or busy backgrounds, paper-cut / collage, risograph / halftone texture, hand-drawn doodles, emoji spam, stock-photo faces, or raw walls of code. If any element looks like clip-art or a decorative illustration, it is wrong — replace it with clean UI, type, or whitespace.

PRODUCT — VybeKiit:
- Tagline: "The SaaS kit that ships itself." Price: $29 one-time, 14-day refund.
- What it is: a paid starter kit whose real product is an AI AGENT that builds, deploys, and maintains a real money-making app for someone who never reads the code.
- The buyer DIRECTS in plain language; the AGENT operates — makes every technical decision, does every step, verifies each one, and translates the few manual steps into one plain sentence at a time.
- Audience: a semi-technical VIBE CODER who has a Claude/Codex subscription and can describe what they want, but does not want to learn env vars, deploys, or merge conflicts.

RENDER THE FULL PAGE — these sections stacked vertically in this order, all with REAL copy (no lorem ipsum):
1. NAV BAR — "VybeKiit" wordmark left; links "How it works · Compare · Pricing · FAQ"; a primary CTA button "Get VybeKiit — $29" right.
2. HERO — the item's exact headline + subhead, a primary CTA "Get VybeKiit — $29" plus a quiet secondary "See how it works", a small trust row "Merchant of Record · 14-day refund · web · mobile · extension", and THE LARGE EMBEDDED PRODUCT-UI SCREENSHOT described in this item.
3. SOCIAL-PROOF STRIP — a slim row of small, monochrome placeholder logos with a one-line stat, e.g. "Ships a live, paying app in your first session."
4. HOW IT WORKS — three clean numbered steps: "1 · Describe it in plain words" → "2 · The agent builds, wires payments, and verifies each step" → "3 · You're live and taking payments".
5. FEATURE ROWS — two alternating sections, each a short heading + supporting line + a small clean product-UI screenshot: (a) "Updates that just install — no merge conflicts, ever" with a version-bump card "@vybekiit/core 1.4 → 1.5 ✓"; (b) "One purchase. Web, mobile, and a browser extension" with the same app shown on desktop + phone.
6. COMPARISON — a minimal, beautifully typeset table: rows VybeKiit ($29) · ShipFast ($199+) · MakerKit ($299+) · Shipped.club ($157+) · Open SaaS ($0); columns "Agent operates it for a non-dev · Updates install (npm, no merge) · Web + mobile + extension · Taxes handled (MoR default)". VybeKiit's row is all ✓ and subtly highlighted in the accent; rivals are mostly ✗ or partial.
7. PRICING — one clean card: "$29 one-time · 14-day refund", included bullets (the agent layer · web + mobile + extension bundle · payments wired · auth + database · auto-localized/RTL · updates as npm bumps · guided deploy), and the same CTA.
8. FAQ — 3–4 question rows: "Best SaaS kit for a non-technical founder?" · "How is this different from Lovable/Bolt?" · "Which kit handles taxes/VAT?" · "Web, mobile and extension in one purchase?".
9. FINAL CTA BAND — the tagline restated with the "Get VybeKiit — $29" button centered.
10. FOOTER — "VybeKiit" wordmark, tagline "The SaaS kit that ships itself.", Terms · Privacy.

HARD CONSTRAINTS (apply to EVERY render):
- Show it responsive: a tall DESKTOP full-page composition as the main artifact, with a MOBILE full-page column beside it showing the SAME page reflowed (single-column nav→hero→…→footer).
- High contrast, accessible text sizes, RTL-safe (mirror-friendly) layout. Keep the primary CTA visually consistent across sections so variants stay A/B comparable.
- LEGIBILITY PRIORITY: render the nav, hero headline + subhead, CTA button, the three step labels, and the pricing price/CTA as crisp, perfectly spelled, fully legible text. The comparison matrix and FAQ may read as realistic typeset blocks (sharp headers and ✓/✗ marks; long body text can be lighter) — never sacrifice the hero's legibility to fit them.
- One coherent design system head to foot: one accent, one type scale, consistent spacing and corner radius.`;

/**
 * @typedef {object} LandingItem
 * One full-page clean landing design. All fields theme the WHOLE page within the
 * shared minimal quality bar; only the hero copy/screenshot and the accent/theme/layout
 * change between items.
 * @property {string} id         Folder + filename stem (kebab, numbered).
 * @property {string} angle      The single claim the page leads on.
 * @property {string} theme      Light/dark base + overall feel (stays minimal either way).
 * @property {string} accent     The single accent color, named with hex.
 * @property {string} layout     Hero composition / page rhythm.
 * @property {string} screenshot What the LARGE embedded product-UI screenshot depicts.
 * @property {string} type       Font choice for the whole page.
 * @property {string} headline   Exact hero H1 — drawn from differentiation.md.
 * @property {string} subhead    Exact hero subhead.
 * @property {string} proof      The small proof element near the hero (chips/metric).
 */

/** @type {LandingItem[]} */
const QUEUE = [
  {
    id: '01-clean-light-centered',
    angle: 'The one-line brand promise (cubic-closest flagship)',
    theme: 'Light — bright white background, near-black ink #0A0A0A, generous whitespace',
    accent: 'Indigo #4F46E5 (CTA, links, check marks only)',
    layout:
      'Centered hero: wordmark nav, large centered headline, subhead, primary + ghost-secondary CTA, trust row, then the large browser-framed product screenshot centered just below',
    screenshot:
      'A clean SaaS dashboard inside a macOS browser frame — left sidebar (Home, Users, Billing, Settings), three metric cards (MRR $4,210 · Active 1,284 · Churn 1.2%), a tidy line chart trending up, and a short recent-activity table',
    type: 'Inter / Geist, large confident headline, tight tracking',
    headline: '"The SaaS kit that ships itself."',
    subhead:
      '"Describe your product in plain words. An AI agent builds it, deploys it, takes payments, and keeps it updated — $29, refundable for 14 days."',
    proof: 'Trust row: Merchant of Record · 14-day refund · web · mobile · extension',
  },
  {
    id: '02-left-hero-split',
    angle: 'You direct, the agent builds (role clarity)',
    theme: 'Light — soft off-white #FAFAFA, ink #0F172A',
    accent: 'Emerald #10B981',
    layout:
      'Left-aligned hero column (headline, subhead, CTA, trust row) on the left half; right half a large browser-framed product screenshot bleeding gently off the right edge — Linear-style',
    screenshot:
      'The agent operator console — a chat panel where the user typed one plain request and the agent posts a green-checked verified progress list (Provisioned ✓ · Payments wired ✓ · Deployed ✓), with a small live-app preview docked beside it',
    type: 'Geist / Inter',
    headline: '"You direct. The agent builds."',
    subhead:
      '"It makes every technical decision, does every step, and verifies each one — then tells you the single thing it needs, in one plain sentence."',
    proof: 'A small "Live ✓ · taking payments" pill on the preview',
  },
  {
    id: '03-dark-premium',
    angle: 'Premium agent-as-operator (tasteful dark flagship)',
    theme:
      'Tasteful DARK — near-black #0B0E14 background, soft off-white text, thin subtle borders (NOT neon, no glow spam)',
    accent: 'Vivid green #3DDC84 (single accent)',
    layout:
      'Left headline with a short accent underline + CTA; right a crisp dark-themed product-UI screenshot with gentle realistic depth shadow — Vercel-dark grade',
    screenshot:
      'A dark-themed SaaS dashboard beside a compact agent progress panel reading "Decide ✓ · Build ✓ · Verify ✓ · Live ✓", with a quiet "first payment received" toast',
    type: 'Bold sans headline, mono micro-labels',
    headline: '"Live and taking payments in your first session."',
    subhead:
      '"Not a demo. A real product on a real stack you own — taking payments before you understand a single line of it."',
    proof: 'A "first payment received" toast on the dashboard',
  },
  {
    id: '04-stripe-soft-gradient',
    angle: 'Skip the plumbing (Stripe-grade calm)',
    theme: 'Light — white page with a single very soft pastel gradient wash behind the hero only',
    accent: 'Restrained indigo #6366F1',
    layout:
      'Centered hero, then a large product screenshot in a clean frame with a soft shadow; Stripe-like calm and restraint',
    screenshot:
      'A clean dashboard whose main panel shows quiet status rows — "Payments ✓ · Auth ✓ · Database ✓ · Hosting ✓ — wired by the agent" — i.e. the plumbing, handled and hidden',
    type: 'Clean geometric sans',
    headline: '"All the plumbing. None of the plumbing."',
    subhead:
      '"Payments, auth, data, and hosting — the agent wires it all and you never see it. You just describe what you want."',
    proof: 'Trust row: web · mobile · extension · taxes handled',
  },
  {
    id: '05-agent-console-hero',
    angle: 'Plain words in, live app out (the demo)',
    theme: 'Light — soft slate #F1F5F9 panels on white',
    accent: 'Blue #2563EB',
    layout:
      'Centered headline; the centerpiece is a large agent-console screenshot framed like a real app, reading top-to-bottom as a short story',
    screenshot:
      'A vertical agent flow — user line "Sell a $9 meal-plan app" → agent steps (Provisioned ✓ · Payments wired ✓ · Deployed ✓) → a live URL chip "mealplan.app · Live ✓ · first payment received"',
    type: 'Sans headline, mono for chat + status lines',
    headline: '"Plain words in. A live app out."',
    subhead:
      '"Tell it what to build. Watch it provision, wire payments, deploy, and go live — then it hands you the URL."',
    proof: 'Bottom chip: "mealplan.app · Live ✓"',
  },
  {
    id: '06-dashboard-metrics-hero',
    angle: 'Here is the product you ship — not a boilerplate',
    theme: 'Light — white, ink #111827',
    accent: 'Teal #0D9488',
    layout:
      'Left short headline + CTA; right a large polished SaaS dashboard screenshot (the shipped product) in a browser frame',
    screenshot:
      'A beautiful analytics dashboard — an MRR area chart trending up, three metric cards, a subscribers table, and a clean sidebar — the real app the buyer ends up owning',
    type: 'Geist',
    headline: '"This is the product you ship — not a boilerplate."',
    subhead:
      '"VybeKiit\'s agent builds a real, paying SaaS on a stack you own, then keeps it updated. Boilerplates stop at the starter code."',
    proof: 'Trust row: Live ✓ · web · mobile · extension',
  },
  {
    id: '07-mobile-web-pair',
    angle: 'One purchase — web, mobile, and an extension (the bundle)',
    theme: 'Light — fresh white',
    accent: 'Indigo #4F46E5',
    layout:
      'Centered headline; the centerpiece shows the SAME app on a desktop browser frame AND a phone frame side by side, one design system, with a small browser-extension popover in the corner',
    screenshot:
      'A desktop dashboard and a phone version of the same product rendered in one consistent design system, plus a compact browser-extension popover showing the same brand',
    type: 'Clean sans',
    headline: '"One purchase. Web, mobile, and a browser extension."',
    subhead:
      '"One agent, one design system — your product everywhere your customers are, for a single $29."',
    proof: 'Tag: "$29 one-time · 14-day refund"',
  },
  {
    id: '08-comparison-led',
    angle: '$29 vs $199+ (the value story, table-forward)',
    theme: 'Light — Vercel-grade white, ink #0A0A0A',
    accent: "Green #22C55E (only on VybeKiit's ✓ column)",
    layout:
      'Short hero, then a beautifully typeset comparison table prominent and high on the page; a small product screenshot supports below it',
    screenshot:
      'A small, crisp dashboard thumbnail beside the comparison table — just enough to anchor "the real product you get"',
    type: 'Inter with tabular numerals',
    headline: '"$29. Not $199, $299, or $1,799."',
    subhead:
      '"The mature kits cost 5–60× and still need a developer to operate them. VybeKiit\'s agent operates it for you."',
    proof: "VybeKiit's all-✓ row highlighted in the accent",
  },
  {
    id: '09-pricing-forward',
    angle: 'One honest price, regret removed (pricing-led)',
    theme: 'Light — warm-neutral #FAFAF9, ink #1C1917',
    accent: 'Violet #7C3AED',
    layout:
      'Hero leads into a prominent, elegant single $29 pricing card with included bullets; a compact product screenshot sits above it as context',
    screenshot:
      'A compact product dashboard above the pricing card, establishing what the $29 actually delivers',
    type: 'Clean sans with large price numerals',
    headline: '"Everything, for $29 once."',
    subhead:
      '"The agent layer, the web + mobile + extension bundle, payments, auth, database, and updates — one price, refundable for 14 days."',
    proof: 'Ribbon under the card: "14-day refund · cancel the regret"',
  },
  {
    id: '10-flagship-minimal',
    angle: 'Maximum restraint — the best-of synthesis',
    theme: 'Light — near-white #FFFFFF, soft ink #0F172A, enormous whitespace',
    accent: 'One calm green #16A34A',
    layout:
      'A single confident centered headline, one CTA, and one gorgeous product-UI screenshot floating with a soft shadow — nothing else competing above the fold; the most cubic-like',
    screenshot:
      'One pristine SaaS dashboard in a clean browser frame as the single hero artifact — sidebar, MRR chart, metric cards, a tidy table',
    type: 'Inter, large, generous line height',
    headline: '"Describe it. It ships."',
    subhead:
      '"An AI agent builds, deploys, and maintains a real, paying product — you just direct. The SaaS kit that ships itself."',
    proof: 'Trust row: $29 · 14-day refund · Merchant of Record',
  },
];

/** Assemble the full-page image prompt for one landing-page item. */
function buildPrompt(item) {
  return `${SHARED}

ART DIRECTION — ${item.id} (themes the ENTIRE page, within the clean quality bar above)
- Leading angle (the ONE thing the page must land): ${item.angle}
- Theme / base feel: ${item.theme}
- Accent color (used sparingly, whole page): ${item.accent}
- Layout / page rhythm: ${item.layout}
- The large embedded product-UI screenshot depicts: ${item.screenshot}
- Typography (whole page): ${item.type}
- Hero headline (use exactly): ${item.headline}
- Hero subhead (use exactly): ${item.subhead}
- Hero proof element: ${item.proof}

Render the COMPLETE landing page now — desktop full-page composition plus the mobile full-page column beside it — as one cohesive, production-quality mockup with every section above present, themed consistently, and the embedded product-UI screenshot rendered as a crisp, realistic app screenshot.`;
}

/** Parse the small CLI surface. */
function parseArgs(argv) {
  const opts = { dryRun: false, from: 1, to: QUEUE.length, only: null, shared: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    if (arg === '--from') opts.from = Number(argv[++i]);
    if (arg === '--to') opts.to = Number(argv[++i]);
    if (arg === '--only') opts.only = argv[++i];
    if (arg === '--shared') opts.shared = true;
  }
  return opts;
}

/** Run the bridge CLI once, streaming stderr and capturing stdout. */
function runBridge(args) {
  const result = spawnSync('node', [BRIDGE, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.status !== 0) {
    console.error(`bridge failed (exit ${result.status})`);
    return false;
  }
  process.stdout.write(result.stdout ?? '');
  return true;
}

/** MD5 hashes of every image already kept in a prior folder this run. */
const savedHashes = new Set();

/**
 * Collapse a freshly-downloaded folder to one PNG per DISTINCT NEW image.
 *
 * Two sources of duplicates are handled:
 *  1. ChatGPT exposes one generated image under several attachment refs, so
 *     `bridge download` writes byte-identical copies (and non-primary refs land
 *     without an extension). We keep the first of each unique hash.
 *  2. In --shared mode the conversation accumulates images, so a download pulls
 *     every PRIOR item's image into this folder too. We drop any hash already
 *     saved in an earlier folder (tracked in `savedHashes`), keeping only what
 *     this turn newly produced.
 *
 * Survivors are renamed `<id>.png` / `<id>-2.png`. Returns the files kept.
 */
function tidyFolder(outDir, id) {
  const files = readdirSync(outDir)
    .map((name) => join(outDir, name))
    .filter((p) => statSync(p).isFile());

  const seenThisFolder = new Set();
  const fresh = [];
  for (const file of files) {
    const hash = createHash('md5').update(readFileSync(file)).digest('hex');
    if (seenThisFolder.has(hash) || savedHashes.has(hash)) {
      rmSync(file);
      continue;
    }
    seenThisFolder.add(hash);
    fresh.push({ file, hash });
  }

  const kept = [];
  fresh.forEach(({ file, hash }, i) => {
    const ext = extname(file).toLowerCase() || '.png';
    const target = join(outDir, i === 0 ? `${id}${ext}` : `${id}-${i + 1}${ext}`);
    if (file !== target) renameSync(file, target);
    savedHashes.add(hash);
    kept.push(target);
  });
  return kept;
}

/** Apply --only / --from / --to filters to the queue. */
function filterQueue(opts) {
  let items = QUEUE;
  if (opts.only) items = items.filter((q) => q.id === opts.only || q.id.endsWith(opts.only));
  return items.filter((_, i) => i + 1 >= opts.from && i + 1 <= opts.to);
}

const opts = parseArgs(process.argv.slice(2));
const items = filterQueue(opts);

if (items.length === 0) {
  console.error('No queue items matched filters.');
  process.exit(1);
}

console.log(`VybeKiit clean landing batch — ${items.length} of ${QUEUE.length} item(s)`);
console.log(`Bridge:  ${BRIDGE}`);
console.log(`Output:  ${OUT_ROOT}`);
console.log(`Chats:   ${opts.shared ? 'one shared conversation' : 'fresh per item'}`);
console.log('');

for (const [index, item] of items.entries()) {
  const prompt = buildPrompt(item);
  console.log(`\n========== ${item.id} ==========\n`);
  if (opts.dryRun) {
    console.log(`${prompt}\n[dry-run — not sent]\n`);
    continue;
  }

  const outDir = join(OUT_ROOT, item.id);
  mkdirSync(outDir, { recursive: true });

  // In shared mode only the first item opens a fresh conversation; the rest
  // continue it. In per-item mode every ask starts fresh for maximum variety.
  const fresh = opts.shared ? index === 0 : true;
  const asked = runBridge([
    'ask',
    prompt,
    '--repo',
    REPO_ROOT,
    ...(fresh ? ['--fresh'] : []),
    '--timeout',
    String(TIMEOUT_SEC),
  ]);
  if (!asked) {
    const next = QUEUE.indexOf(item) + 1;
    console.error(
      `Stopped at ${item.id}. Resume with: --from ${next}${opts.shared ? ' --shared' : ''}`,
    );
    process.exit(1);
  }

  runBridge(['download', '--repo', REPO_ROOT, '--out', outDir]);

  const kept = tidyFolder(outDir, item.id);
  console.log(`saved ${kept.length} image(s): ${kept.map((p) => p.split('/').pop()).join(', ')}`);
}

console.log('\nDone.');
