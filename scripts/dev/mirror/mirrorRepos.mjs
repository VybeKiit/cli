#!/usr/bin/env node
// One-way monorepo → mirror sync (ADR-0005).
// For each mirror, `git subtree split` isolates the mapped source prefix into a single
// SHA and force-pushes that SHA to `VybeKiit/<repo>@main`. The monorepo stays the single
// source of truth; mirrors are derived artifacts and must never be hand-edited.
//
// Covers the delivery repos (ADR-0005 + ADR-0038): the three OWNED templates
// (web/mobile/extension), the public `cli` scaffolder, `infra`, and the gated kit
// workspace (`kit` — packages + templates for `create app`). Single-prefix mirrors use
// `git subtree split`. The kit mirror is multi-path and is staged by `syncKitMirror.mjs`.

import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { repoRootFrom } from '../../lib/repoRoot.mjs';
import { KIT_MIRROR_REPO, syncKitMirror } from './syncKitMirror.mjs';

const execFileAsync = promisify(execFile);

/** GitHub org that holds the per-template/-component mirror repos (ADR-0005). */
const MIRROR_ORG = 'VybeKiit';

/** Repo root, so prefix-existence probes work regardless of the caller's cwd. */
const REPO_ROOT = repoRootFrom(import.meta.url);

/**
 * The delivery mirror registry (ADR-0005): one entry per `VybeKiit/<repo>`, mapping the
 * mirror to the monorepo path whose subtree it publishes. `repo` doubles as the on-disk
 * prefix's leaf and the remote name. The split prefix is the full `path`, so a repo can
 * live at the root (`cli`) or under a parent dir (`templates/web`) — the prefix need not
 * match the repo name.
 *
 * `kit` is **not** in this list: it is multi-path (`packages/` + `templates/`) and is
 * published by {@link syncKitMirror} after the prefix mirrors run.
 *
 * @typedef {{ repo: string, path: string }} MirrorTarget
 * @type {readonly MirrorTarget[]}
 */
const MIRRORS = [
  { repo: 'web', path: 'templates/web' },
  { repo: 'mobile', path: 'templates/mobile' },
  { repo: 'extension', path: 'templates/extension' },
  { repo: 'cli', path: 'cli' },
  { repo: 'infra', path: 'infra' },
];

/** Prefix-split mirror names only. */
const PREFIX_MIRROR_NAMES = MIRRORS.map((m) => m.repo);

/** Every known delivery name (prefix mirrors + kit workspace), for arg validation. */
const MIRROR_NAMES = [...PREFIX_MIRROR_NAMES, KIT_MIRROR_REPO];

/**
 * Strip the mirror token out of any text before it is logged. A failed `git push`
 * surfaces the full remote URL — token included — in its stderr/`error.message`, so every
 * logged git error must pass through here. Without GitHub Actions' secret masking, a local
 * run would otherwise print the token to the terminal.
 *
 * @param {string} text - text that may contain the embedded `GH_MIRROR_TOKEN`
 * @returns {string} `text` with every token occurrence replaced by `***`, or unchanged
 *   when no token is configured
 */
export function redact(text) {
  const token = process.env.GH_MIRROR_TOKEN;
  if (!token) {
    return text;
  }
  return text.split(token).join('***');
}

/**
 * Build the push URL for a mirror. In CI a `GH_MIRROR_TOKEN` (a PAT with `contents:write`
 * on the mirrors) is embedded as the `x-access-token` user; locally the tokenless URL
 * relies on the user's git credential helper (`gh` device-flow). The token is never logged.
 *
 * @param {string} repo - mirror repo name under {@link MIRROR_ORG}
 * @returns {string} the `https://github.com/...` remote to push to
 */
function mirrorUrl(repo) {
  const token = process.env.GH_MIRROR_TOKEN;
  const auth = token ? `x-access-token:${token}@` : '';
  return `https://${auth}github.com/${MIRROR_ORG}/${repo}.git`;
}

/** True when a mapped prefix actually exists on disk (an unmade `infra/` is skipped). */
async function prefixExists(path) {
  try {
    await access(join(REPO_ROOT, path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Split one mirror's mapped prefix into a standalone commit SHA.
 *
 * @param {MirrorTarget} target - the mirror whose `path` subtree is isolated
 * @returns {Promise<string>} the split commit SHA, ready to push as a branch tip
 */
async function splitSubtree(target) {
  const { stdout } = await execFileAsync('git', ['subtree', 'split', `--prefix=${target.path}`]);
  return stdout.trim();
}

/**
 * Force-push a split SHA to the mirror's `main`. One-way and destructive by design:
 * the mirror is overwritten with the monorepo's current subtree state.
 *
 * @param {string} repo - mirror repo name
 * @param {string} sha - subtree split SHA to publish
 */
async function pushMirror(repo, sha) {
  await execFileAsync('git', ['push', '--force', mirrorUrl(repo), `${sha}:refs/heads/main`]);
}

/**
 * Mirror one target: split its prefix, then (unless dry-run) force-push it.
 *
 * @param {MirrorTarget} target - the mirror to publish
 * @param {boolean} dryRun - when true, compute + log only, never push
 */
async function mirrorOne(target, dryRun) {
  const sha = await splitSubtree(target);
  if (dryRun) {
    console.log(`  ${target.repo}: split ${sha} (dry-run, not pushed)`);
    return;
  }
  await pushMirror(target.repo, sha);
  console.log(`  ${target.repo}: pushed ${sha} → ${MIRROR_ORG}/${target.repo}@main`);
}

/**
 * Resolve the requested names to runnable prefix-mirror targets, partitioning out those
 * whose source prefix is absent. Kit is handled separately (not a single prefix).
 *
 * @param {readonly string[]} names - mirror names to run
 * @returns {Promise<{ runnable: MirrorTarget[], skipped: MirrorTarget[], includeKit: boolean }>}
 */
async function resolveRunnable(names) {
  const includeKit = names.includes(KIT_MIRROR_REPO);
  const targets = MIRRORS.filter((m) => names.includes(m.repo));
  const runnable = [];
  const skipped = [];
  for (const target of targets) {
    if (await prefixExists(target.path)) {
      runnable.push(target);
    } else {
      skipped.push(target);
    }
  }
  return { runnable, skipped, includeKit };
}

/**
 * Parse CLI args into the dry-run flag and the mirror list to run (default: all).
 *
 * @param {readonly string[]} argv - args after `node script.mjs`
 * @returns {{ dryRun: boolean, names: string[] }} resolved run options
 */
export function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const requested = argv.filter((arg) => !arg.startsWith('--'));
  const unknown = requested.filter((name) => !MIRROR_NAMES.includes(name));
  if (unknown.length > 0) {
    throw new Error(`Unknown mirror(s): ${unknown.join(', ')}. Known: ${MIRROR_NAMES.join(', ')}`);
  }
  return { dryRun, names: requested.length > 0 ? requested : [...MIRROR_NAMES] };
}

/**
 * Mirror each runnable target, isolating failures so one bad push doesn't abort the rest.
 * Logs a redacted reason per failure (the swallowed-error gap the earlier version had) and
 * exits non-zero if any target failed. Always attempts kit last when requested (ADR-0038).
 */
async function main() {
  const { dryRun, names } = parseArgs(process.argv.slice(2));
  const { runnable, skipped, includeKit } = await resolveRunnable(names);

  for (const target of skipped) {
    console.log(`  ${target.repo}: skipped — no source at ${target.path}/ yet`);
  }

  const failed = [];
  for (const target of runnable) {
    try {
      await mirrorOne(target, dryRun);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ${target.repo}: FAILED — ${redact(message)}`);
      failed.push(target.repo);
    }
  }

  if (includeKit) {
    try {
      await syncKitMirror({ dryRun });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ${KIT_MIRROR_REPO}: FAILED — ${redact(message)}`);
      failed.push(KIT_MIRROR_REPO);
    }
  }

  if (failed.length > 0) {
    console.error(`\nmirror sync: ${failed.length} failed (${failed.join(', ')}).`);
    process.exitCode = 1;
  }
}

// Only auto-run as a script; importing for tests must not trigger a real sync.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
