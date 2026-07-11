#!/usr/bin/env node
/**
 * Build and force-push the gated kit workspace delivery repo (`VybeKiit/kit`).
 *
 * ADR-0038 Track 2: `vybekiit create app` clones this repo (not a single template
 * mirror) so `packages/` + `templates/` exist under one root and `workspace:*`
 * resolves. Subtree split cannot publish multi-prefix trees, so this script stages
 * a slim kit tree and force-pushes it one-way monorepo → kit.
 *
 * Never hand-edit `VybeKiit/kit` — the next sync overwrites it.
 */

import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { shouldCopyKitPath } from '../../lib/deliveryCopyPolicy.mjs';
import { repoRootFrom } from '../../lib/repoRoot.mjs';
import { redact } from './mirrorTagShared.mjs';

const execFileAsync = promisify(execFile);

const MIRROR_ORG = 'VybeKiit';
/** Delivery repo name — must match `KIT_MIRROR_REPO` in `cli/src/lib/resolveKitSource.ts`. */
export const KIT_MIRROR_REPO = 'kit';
const REPO_ROOT = repoRootFrom(import.meta.url);

/** Paths copied from the monorepo root into the kit delivery tree. */
const ROOT_FILES = [
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  '.npmrc',
  'tsconfig.base.json',
  'tsup.base.ts',
];

/** Directory prefixes required for create-app + workspace resolution. */
const ROOT_DIRS = ['packages', 'templates'];

/**
 * Build the HTTPS push URL for the kit mirror (token in CI, credential helper locally).
 *
 * @returns {string} Git remote URL.
 */
const kitMirrorUrl = () => {
  const token = process.env.GH_MIRROR_TOKEN;
  const auth = token ? `x-access-token:${token}@` : '';
  return `https://${auth}github.com/${MIRROR_ORG}/${KIT_MIRROR_REPO}.git`;
};

/**
 * Buyer-facing README written into the kit delivery repo (not the monorepo root).
 *
 * @returns {string} Markdown for the kit mirror.
 */
export const kitBuyerReadme = () => `# VybeKiit kit workspace

This is your **paid kit access** folder: the shared pieces plus the app starting points.

You do **not** need to live in this repo day to day.

## Start here (one path)

1. On your computer, open Terminal.
2. Run:

\`\`\`sh
npx vybekiit setup
npx vybekiit create app --web
\`\`\`

3. Open the new folder your computer created.
4. Paste this into your AI coding tool (Claude Code, Cursor, Codex, …):

\`\`\`text
Set up my app.

I am a non-technical vibe coder. Read AGENTS.md and language.md.
Speak plain language. One action at a time. Translate any errors.
Celebrate progress. Do not dump technical steps on me.

Start with first-time setup until I can see my app running on my computer.
\`\`\`

## Do not

- Do **not** use **Download ZIP** from GitHub.
- Do **not** hand-edit this repo. It is auto-synced from VybeKiit and will be overwritten.
- You do **not** need the green **Code** button unless your AI helper asks for a clone.

## If something fails

Run \`npx vybekiit doctor\` and show the plain-language output to your AI helper.
`;

/**
 * Stage monorepo kit sources into `stageDir`.
 *
 * @param {string} stageDir - Empty directory that becomes the kit tree.
 * @returns {Promise<void>}
 */
export const stageKitTree = async (stageDir) => {
  for (const dir of ROOT_DIRS) {
    const from = join(REPO_ROOT, dir);
    const to = join(stageDir, dir);
    await cp(from, to, {
      recursive: true,
      filter: (src) => shouldCopyKitPath(src),
    });
  }

  for (const file of ROOT_FILES) {
    const from = join(REPO_ROOT, file);
    try {
      await cp(from, join(stageDir, file));
    } catch {
      // Optional root file (e.g. lockfile edge cases) — skip if missing.
    }
  }

  await writeFile(join(stageDir, 'README.md'), kitBuyerReadme(), 'utf8');
  await writeFile(
    join(stageDir, '.gitignore'),
    ['node_modules/', 'dist/', '.turbo/', '.next/', 'coverage/', '*.tsbuildinfo', ''].join('\n'),
    'utf8',
  );
};

/**
 * Force-push a staged kit tree to `VybeKiit/kit@main`.
 *
 * @param {string} stageDir - Directory with the kit tree (must already be staged).
 * @returns {Promise<void>}
 */
const pushStagedKit = async (stageDir) => {
  await execFileAsync('git', ['init', '-b', 'main'], { cwd: stageDir });
  await execFileAsync('git', ['config', 'user.email', 'kit-mirror@vybekiit.local'], {
    cwd: stageDir,
  });
  await execFileAsync('git', ['config', 'user.name', 'VybeKiit kit mirror'], { cwd: stageDir });
  await execFileAsync('git', ['add', '-A'], { cwd: stageDir });
  await execFileAsync('git', ['commit', '-m', 'chore: sync gated kit workspace from monorepo'], {
    cwd: stageDir,
  });
  await execFileAsync(
    'git',
    ['push', '--force', kitMirrorUrl(), 'HEAD:refs/heads/main'],
    { cwd: stageDir },
  );
};

/**
 * Build and (unless dry-run) force-push the kit delivery mirror.
 *
 * @param {{ dryRun?: boolean }} [options] - When dryRun, stage only and log.
 * @returns {Promise<void>}
 */
export const syncKitMirror = async (options = {}) => {
  const dryRun = options.dryRun === true;
  const parent = await mkdtemp(join(tmpdir(), 'vybekiit-kit-mirror-'));
  const stageDir = join(parent, KIT_MIRROR_REPO);

  try {
    await mkdir(stageDir, { recursive: true });
    await stageKitTree(stageDir);

    if (dryRun) {
      console.log(`  ${KIT_MIRROR_REPO}: staged kit tree at ${stageDir} (dry-run, not pushed)`);
      return;
    }

    await pushStagedKit(stageDir);
    console.log(
      `  ${KIT_MIRROR_REPO}: force-pushed packages + templates → ${MIRROR_ORG}/${KIT_MIRROR_REPO}@main`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redact(message));
  } finally {
    if (!dryRun) {
      await rm(parent, { recursive: true, force: true });
    }
  }
};

// Only auto-run as a script; importing for tests must not trigger a real sync.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes('--dry-run');
  syncKitMirror({ dryRun }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`kit mirror: FAILED — ${redact(message)}`);
    process.exitCode = 1;
  });
}
