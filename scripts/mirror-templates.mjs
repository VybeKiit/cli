#!/usr/bin/env node
// One-way monorepo → mirror sync (ADR-0005).
// For each template, `git subtree split` isolates its subtree into a single SHA and
// force-pushes that SHA to `VybeKiit/<template>@main`. The monorepo stays the single
// source of truth; mirrors are derived artifacts and must never be hand-edited.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** GitHub org that holds the private per-template mirror repos (ADR-0005). */
const MIRROR_ORG = 'VybeKiit';

/** Templates mirrored on every sync; each maps `templates/<t>` → `VybeKiit/<t>@main`. */
const TEMPLATES = ['web', 'mobile', 'extension'];

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
function redact(text) {
  const token = process.env.GH_MIRROR_TOKEN;
  if (!token) {
    return text;
  }
  return text.split(token).join('***');
}

/**
 * Build the push URL for a template mirror. In CI a `GH_MIRROR_TOKEN` (a PAT with
 * `contents:write` on the mirrors) is embedded as the `x-access-token` user; locally the
 * tokenless URL relies on the user's git credential helper. The token is never logged.
 *
 * @param {string} template - mirror repo name under {@link MIRROR_ORG}
 * @returns {string} the `https://github.com/...` remote to push to
 */
function mirrorUrl(template) {
  const token = process.env.GH_MIRROR_TOKEN;
  const auth = token ? `x-access-token:${token}@` : '';
  return `https://${auth}github.com/${MIRROR_ORG}/${template}.git`;
}

/**
 * Split one template's subtree into a standalone commit SHA.
 *
 * @param {string} template - template under `templates/`
 * @returns {Promise<string>} the split commit SHA, ready to push as a branch tip
 */
async function splitSubtree(template) {
  const { stdout } = await execFileAsync('git', [
    'subtree',
    'split',
    `--prefix=templates/${template}`,
  ]);
  return stdout.trim();
}

/**
 * Force-push a split SHA to the mirror's `main`. One-way and destructive by design:
 * the mirror is overwritten with the monorepo's current subtree state.
 *
 * @param {string} template - mirror repo name
 * @param {string} sha - subtree split SHA to publish
 */
async function pushMirror(template, sha) {
  await execFileAsync('git', ['push', '--force', mirrorUrl(template), `${sha}:refs/heads/main`]);
}

/**
 * Mirror one template: split its subtree, then (unless dry-run) force-push it.
 *
 * @param {string} template - template to mirror
 * @param {boolean} dryRun - when true, compute + log only, never push
 */
async function mirrorTemplate(template, dryRun) {
  const sha = await splitSubtree(template);
  console.log(`subtree split templates/${template} → ${sha}`);
  if (dryRun) {
    console.log(`[dry-run] would push → ${MIRROR_ORG}/${template}@main`);
    return;
  }
  await pushMirror(template, sha);
  console.log(`pushed → ${MIRROR_ORG}/${template}@main`);
}

/**
 * Parse CLI args into the dry-run flag and the template list to run (default: all).
 *
 * @param {readonly string[]} argv - args after `node script.mjs`
 * @returns {{ dryRun: boolean, templates: string[] }} resolved run options
 */
function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const requested = argv.filter((arg) => !arg.startsWith('--'));
  const unknown = requested.filter((t) => !TEMPLATES.includes(t));
  if (unknown.length > 0) {
    throw new Error(`Unknown template(s): ${unknown.join(', ')}. Known: ${TEMPLATES.join(', ')}`);
  }
  return { dryRun, templates: requested.length > 0 ? requested : [...TEMPLATES] };
}

/**
 * Mirror each requested template, isolating failures so one bad push doesn't abort the
 * rest. Exits non-zero if any template failed.
 */
async function main() {
  const { dryRun, templates } = parseArgs(process.argv.slice(2));
  const failed = [];
  for (const template of templates) {
    try {
      await mirrorTemplate(template, dryRun);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`failed → ${MIRROR_ORG}/${template}: ${redact(message)}`);
      failed.push(template);
    }
  }
  if (failed.length > 0) {
    console.error(`mirror sync failed for: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main();
