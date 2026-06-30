#!/usr/bin/env node
/**
 * Run the VybeKiit CLI welcome-banner concept image queue through ai-browser-bridge.
 *
 * One prompt → one ChatGPT turn → download images to out/cli-banner-inspirations/<id>/
 *
 * Prerequisites:
 *   - ai-browser-bridge built: ../ai-browser-bridge/dist/bridge.js
 *   - ChatGPT signed in (bridge login --repo .)
 *   - Image-capable model selected in ChatGPT
 *
 * Usage:
 *   node scripts/run-bridge-cli-banner-queue.mjs --dry-run
 *   node scripts/run-bridge-cli-banner-queue.mjs
 *   node scripts/run-bridge-cli-banner-queue.mjs --from 1 --to 3
 *   node scripts/run-bridge-cli-banner-queue.mjs --only chevron-shimmer
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRIDGE = process.env.BRIDGE ?? resolve(REPO_ROOT, '../ai-browser-bridge/dist/bridge.js');
const OUT_ROOT = resolve(REPO_ROOT, 'out/cli-banner-inspirations');
const TIMEOUT_SEC = Number(process.env.BRIDGE_TIMEOUT ?? 600);
const DIRECTION_BRIEF = '@docs/positioning/cli-banner-direction.md';

const SHARED = `Generate ONE high-fidelity image: a macOS Terminal / iTerm2 window screenshot mockup showing the VybeKiit CLI welcome banner on first run of \`vybekiit setup\`.

This is a DESIGN CONCEPT for ASCII text art we will implement later in pure monospace + ANSI colors — not the final ASCII output.

REQUIREMENTS:
- Dark terminal background (#0B0E14), subtle window chrome, realistic terminal font (SF Mono / Menlo).
- The "ASCII art" inside the terminal must look achievable with slashes, pipes, block chars, box-drawing — max ~60 cols wide, ~14 lines tall for the logo block.
- Brand mark: three stacked chevrons (VybeKiit logo).
- Wordmark: VybeKiit (can be spaced or block letters).
- Motto below logo in dim gray: "Ship SaaS and projects like a software engineer — without becoming one."
- Show a hint of cyan→violet gradient shimmer on the logo/wordmark (static still capturing the effect).
- Below the banner, faint placeholder doctor output lines (✓ gh, ✓ wrangler) — optional, small.
- NO lorem ipsum, NO huge code wall, NO photos inside the art.
- Corner label in tiny monospace: see ART DIRECTION label below.

Read the attached art-direction brief for full brand constraints.`;

/** @type {Array<{ id: string; slug: string; label: string; artDirection: string }>} */
const QUEUE = [
  {
    id: '01-chevron-shimmer',
    slug: 'chevron-shimmer',
    label: 'Direction 1 — Chevron Shimmer',
    artDirection: `Refined triple-chevron logo centered, each chevron built from / \\ and underscores. VybeKiit wordmark directly below with letter spacing. Strong cyan→violet horizontal gradient sweep frozen mid-animation across chevrons + wordmark. Clean, premium — like Linear CLI meets Stripe. This is the polished evolution of a basic chevron ASCII.`,
  },
  {
    id: '02-ship-launch',
    slug: 'ship-launch',
    label: 'Direction 2 — Ship Launch',
    artDirection: `ASCII rocket or ship made from punctuation ascending from the chevrons (>>> becomes exhaust trails). Playful but still monospace-achievable. Motto feels like a launch countdown. Gradient on the rocket body. Energy without chaos — "ship SaaS" metaphor literal but tasteful.`,
  },
  {
    id: '03-pixel-kit',
    slug: 'pixel-kit',
    label: 'Direction 3 — Pixel Kit',
    artDirection: `8-bit pixel-art style VybeKiit logo using block chars (█ ▓ ░) — retro game boot screen. Three chevrons as pixel layers. Shimmer shown as alternating bright/dim pixel columns. Nostalgic vibe coder aesthetic, still fits dark terminal.`,
  },
  {
    id: '04-crt-phosphor',
    slug: 'crt-phosphor',
    label: 'Direction 4 — CRT Phosphor',
    artDirection: `Classic green phosphor (#39FF14) on near-black with subtle scanlines and soft bloom. Chevrons + VybeKiit in CRT ASCII. Shimmer = phosphor intensity variation. Slight curved screen vignette. Feels like 1980s mainframe welcome but modern copy.`,
  },
  {
    id: '05-block-wordmark',
    slug: 'block-wordmark',
    label: 'Direction 5 — Block Wordmark',
    artDirection: `Huge FIGlet-style block letters "VYBEKIIT" as the hero — chevron mark small above or embedded in the V. Bold, poster-like within the terminal. Gradient shimmer runs vertically through the block letters. Maximum legibility at a glance.`,
  },
  {
    id: '06-minimal-oneline',
    slug: 'minimal-oneline',
    label: 'Direction 6 — Minimal One-Line',
    artDirection: `Ultra-minimal: single-line chevron mark + "VybeKiit" on one row, motto on next line only. Lots of negative space. Shimmer is a thin underline or caret pulse under the wordmark. Vercel/Linear restraint — quiet confidence.`,
  },
  {
    id: '07-toolkit-stack',
    slug: 'toolkit-stack',
    label: 'Direction 7 — Toolkit Stack',
    artDirection: `Chevron logo left; right side a tiny ASCII stack of boxes labeled abstract tools (auth, pay, deploy) as ▄▄▄ blocks. Communicates "full kit" without icons. Subtle gradient on chevrons only. Achievable with box-drawing chars.`,
  },
  {
    id: '08-wave-gradient',
    slug: 'wave-gradient',
    label: 'Direction 8 — Wave Gradient',
    artDirection: `Shimmer shown as a visible sine-wave band of color moving across the ASCII art (freeze 3 phase offsets as faint ghost layers OR one frame with wave highlight). Chevrons + wordmark. Most "animated" looking still — tests if the effect reads before we build frames.`,
  },
  {
    id: '09-director-terminal',
    slug: 'director-terminal',
    label: 'Direction 9 — Director Terminal',
    artDirection: `Cinematic: spotlight cone made of ASCII . : * characters illuminating the chevron logo. Motto in "director's clapper" frame made of dashes. Dark studio black terminal. Gold accent on one chevron stroke. "You're the director" energy without literal photos.`,
  },
  {
    id: '10-bold-poster',
    slug: 'bold-poster',
    label: 'Direction 10 — Bold Poster',
    artDirection: `Typographic poster inside terminal: giant "SHIP" in ASCII block letters, smaller VybeKiit chevrons as logo mark, motto as subtitle. High contrast white + neon magenta OR acid green accent (pick one). Bold statement — memorable first second after purchase.`,
  },
];

function buildPrompt(item) {
  return `${SHARED}\n\nART DIRECTION — ${item.label}:\n${item.artDirection}\n\nLabel corner: ${item.label}.\n\nGenerate the terminal banner concept image now.`;
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

console.log(`VybeKiit CLI banner queue — ${items.length} item(s)`);
console.log(`Bridge: ${BRIDGE}`);
console.log(`Output: ${OUT_ROOT}`);
console.log('');

for (const item of items) {
  const prompt = buildPrompt(item);
  console.log(`\n========== ${item.id} (${item.slug}) ==========\n`);
  if (opts.dryRun) {
    console.log(prompt.slice(0, 500) + '...\n[dry-run — skipped]\n');
    continue;
  }

  mkdirSync(join(OUT_ROOT, item.id), { recursive: true });

  const ok = runBridge([
    'ask',
    DIRECTION_BRIEF,
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
