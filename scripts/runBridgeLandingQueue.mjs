#!/usr/bin/env node
/**
 * Run the VybeKiit landing hero image queue through ai-browser-bridge.
 *
 * One prompt → one ChatGPT turn → download images to out/landing-inspirations/<id>/
 *
 * Prerequisites:
 *   - ai-browser-bridge built: ../ai-browser-bridge/dist/bridge.js
 *   - ChatGPT signed in (bridge login --repo .)
 *   - Image-capable model selected in ChatGPT
 *   - cloudflared only if using --tools (not needed for image-only queue)
 *
 * Usage:
 *   node scripts/run-bridge-landing-queue.mjs --dry-run
 *   node scripts/run-bridge-landing-queue.mjs
 *   node scripts/run-bridge-landing-queue.mjs --from 3 --to 5
 *   node scripts/run-bridge-landing-queue.mjs --only before-after
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIDGE = process.env.BRIDGE ?? resolve(REPO_ROOT, '../ai-browser-bridge/dist/bridge.js');
const OUT_ROOT = resolve(REPO_ROOT, 'out/landing-inspirations');
const TIMEOUT_SEC = Number(process.env.BRIDGE_TIMEOUT ?? 600);

const SHARED = `Generate ONE high-fidelity landing page hero mockup image (UI design screenshot style, not photography of people).

Product: VybeKiit — "The SaaS kit that ships itself." $29 one-time, 14-day refund.
Brand: modern SaaS (Stripe/Linear/Vercel quality). Real UI copy, no lorem ipsum, no stock faces.
Include: nav with VybeKiit wordmark, hero headline + subhead, primary CTA, 2–3 trust badges.
Desktop 16:9 hero fully visible. RTL-safe layout. Show the AGENT operating (chat/checklist/progress), not raw code unless direction contrasts code vs agent.`;

/** @type {Array<{ id: string; slug: string; label: string; artDirection: string }>} */
const QUEUE = [
  {
    id: '01-terminal-to-live',
    slug: 'terminal-to-live',
    label: 'Direction 1 — Terminal-to-Live',
    artDirection: `Dark IDE/terminal aesthetic; terminal shows plain-English user instructions, not code. Palette: #0B0E14, terminal-green accent, warm amber/coral CTA. Headline: "You direct. The agent builds." Sub: "Describe your product. It ships — live and taking payments — in your first session." Proof: faux chat — user "sell a $9 meal-plan app", agent green checklist ending Live ✓.`,
  },
  {
    id: '02-split-screen',
    slug: 'split-screen',
    label: 'Direction 2 — Split-screen',
    artDirection: `Two columns. Left: code wall + red "merge conflict" badge. Right: calm agent chat + green "Updated ✓". Palette: left grey, right indigo + mint. Headline: "Boilerplates give developers a head start. VybeKiit gives everyone else a finished product."`,
  },
  {
    id: '03-three-platform',
    slug: 'three-platform',
    label: 'Direction 3 — Three-Platform Bundle',
    artDirection: `Laptop (web), phone (mobile), browser toolbar (extension) floating together, unified tokens. Soft violet→sky gradient, Apple-keynote calm. Headline: "One purchase. Web, mobile, and a browser extension." Sub: "One agent. Zero plumbing." Proof: $29 price tag bridging devices.`,
  },
  {
    id: '04-receipt-mor',
    slug: 'receipt-mor',
    label: 'Direction 4 — Receipt / MoR',
    artDirection: `Playful receipt + passport stamp "VAT handled". Finance-trust greens, paper-white. Headline: "Taxes handled. Merchant of Record built in." Sub: "Sell worldwide. Never file a VAT form." Proof: globe with ✓ tax pins.`,
  },
  {
    id: '05-directors-chair',
    slug: 'directors-chair',
    label: "Direction 5 — Director's Chair",
    artDirection: `Cinematic studio black + gold spotlight. Director's chair + clapperboard "TAKE 1 — LIVE". Glowing abstract agent as crew. Headline: "You're the director. The agent is the whole crew."`,
  },
  {
    id: '06-checklist',
    slug: 'checklist',
    label: 'Direction 6 — Checklist',
    artDirection: `Ultra-clean white, single green accent, Linear/Vercel minimal. Vertical checklist all green. Headline: "It checks every step worked — so you never get silently stuck." Proof: Account ✓ · Payments ✓ · Deployed ✓ · Live & paid ✓`,
  },
  {
    id: '07-vibe-coder',
    slug: 'vibe-coder',
    label: 'Direction 7 — Vibe-Coder',
    artDirection: `Warm creator desk flat-lay (coffee, sticky notes, Claude tab). Cream + peach + purple. Headline: "You can describe it. That's enough." Proof: speech bubble "make me a booking app" → live URL chip.`,
  },
  {
    id: '08-before-after',
    slug: 'before-after',
    label: 'Direction 8 — Before/After',
    artDirection: `Draggable before/after slider. Left "Day 1: an idea", right "Session 1: live, paying app". Slate→sunrise palette. Headline: "Live and taking payments in your first session." Proof: first payment toast + URL chip.`,
  },
  {
    id: '09-quiet-stack',
    slug: 'quiet-stack',
    label: 'Direction 9 — Quiet Stack',
    artDirection: `Blueprint adapter blocks (payments/auth/data/hosting) greyed out. Monochrome + one live accent. Headline: "All the plumbing. None of the plumbing." Proof: toggle "the agent picks" over adapter grid.`,
  },
  {
    id: '10-bold-statement',
    slug: 'bold-statement',
    label: 'Direction 10 — Bold Statement',
    artDirection: `Huge typographic poster, black bg, neon acid-green or hot-magenta. Headline: "The SaaS kit that ships itself." Sub: "$29. Refundable for 14 days." Minimal imagery, emphasize "itself".`,
  },
];

function buildPrompt(item) {
  return `${SHARED}\n\nART DIRECTION — ${item.label}:\n${item.artDirection}\n\nLabel corner: ${item.label}. Generate the hero mockup image now.`;
}

function parseArgs(argv) {
  const opts = { dryRun: false, from: 1, to: QUEUE.length, only: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    if (arg === '--from') opts.from = Number(argv[++i]);
    if (arg === '--to') opts.to = Number(argv[++i]);
    if (arg === '--only') opts.only = argv[++i];
  }
  return opts;
}

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

function filterQueue(opts) {
  let items = QUEUE;
  if (opts.only) items = items.filter((q) => q.slug === opts.only || q.id === opts.only);
  return items.filter((_, i) => i + 1 >= opts.from && i + 1 <= opts.to);
}

const opts = parseArgs(process.argv.slice(2));
const items = filterQueue(opts);

if (items.length === 0) {
  console.error('No queue items matched filters.');
  process.exit(1);
}

console.log(`VybeKiit landing queue — ${items.length} item(s)`);
console.log(`Bridge: ${BRIDGE}`);
console.log(`Output: ${OUT_ROOT}`);
console.log('');

for (const item of items) {
  const prompt = buildPrompt(item);
  console.log(`\n========== ${item.id} (${item.slug}) ==========\n`);
  if (opts.dryRun) {
    console.log(prompt.slice(0, 400) + '...\n[dry-run — skipped]\n');
    continue;
  }

  mkdirSync(join(OUT_ROOT, item.id), { recursive: true });

  const ok = runBridge([
    'ask',
    prompt,
    '--repo',
    REPO_ROOT,
    '--fresh',
    '--timeout',
    String(TIMEOUT_SEC),
  ]);
  if (!ok) {
    console.error(`Stopped at ${item.id}. Re-run with: --from ${QUEUE.indexOf(item) + 1}`);
    process.exit(1);
  }

  runBridge(['download', '--repo', REPO_ROOT, '--out', join(OUT_ROOT, item.id)]);
}

console.log('\nDone.');
