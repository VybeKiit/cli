#!/usr/bin/env node
/**
 * Push a unified kit release tag to each delivery mirror at its current main HEAD.
 * Run after `pnpm mirror` so tags point at the freshly force-pushed mirror commits.
 *
 * Usage: node scripts/tagMirrorRepos.mjs v1.2.3 [--dry-run]
 */
import process from 'node:process';
import { MIRROR_ORG, prefixExists, redact } from './mirrorTagShared.mjs';

const MIRRORS = [
  { repo: 'web', path: 'templates/web' },
  { repo: 'mobile', path: 'templates/mobile' },
  { repo: 'extension', path: 'templates/extension' },
  { repo: 'cli', path: 'cli' },
  { repo: 'infra', path: 'infra' },
];

const tag = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!(tag && /^v\d+\.\d+\.\d+$/.test(tag))) {
  console.error('Usage: node scripts/tagMirrorRepos.mjs vX.Y.Z [--dry-run]');
  process.exit(1);
}

/**
 * Create an annotated tag ref on a mirror repo at its main branch HEAD via GitHub API.
 * @param {string} repo
 * @param {string} token
 */
async function tagMirror(repo, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const refRes = await fetch(
    `https://api.github.com/repos/${MIRROR_ORG}/${repo}/git/ref/heads/main`,
    { headers },
  );
  if (!refRes.ok) {
    throw new Error(`Could not read main ref for ${repo}: ${refRes.status} ${await refRes.text()}`);
  }
  const refData = await refRes.json();
  const sha = refData.object.sha;

  const tagRes = await fetch(`https://api.github.com/repos/${MIRROR_ORG}/${repo}/git/tags`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag,
      message: `Kit release ${tag}`,
      object: sha,
      type: 'commit',
    }),
  });
  if (!tagRes.ok) {
    throw new Error(
      `Could not create tag object for ${repo}: ${tagRes.status} ${await tagRes.text()}`,
    );
  }
  const tagObject = await tagRes.json();

  const refCreate = await fetch(`https://api.github.com/repos/${MIRROR_ORG}/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref: `refs/tags/${tag}`,
      sha: tagObject.sha,
    }),
  });
  if (refCreate.status === 422) {
    const updateRes = await fetch(
      `https://api.github.com/repos/${MIRROR_ORG}/${repo}/git/refs/tags/${tag}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: tagObject.sha, force: true }),
      },
    );
    if (!updateRes.ok) {
      throw new Error(`Could not update tag ${tag} on ${repo}: ${updateRes.status}`);
    }
    console.log(`  ${repo}: updated tag ${tag} → ${sha.slice(0, 7)}`);
    return;
  }
  if (!refCreate.ok) {
    throw new Error(
      `Could not create tag ref for ${repo}: ${refCreate.status} ${await refCreate.text()}`,
    );
  }
  console.log(`  ${repo}: tagged ${tag} → ${sha.slice(0, 7)}`);
}

async function main() {
  const token = process.env.GH_MIRROR_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!(token || dryRun)) {
    console.error('Set GH_MIRROR_TOKEN or GITHUB_TOKEN to tag mirror repos.');
    process.exit(1);
  }

  const failed = [];
  for (const mirror of MIRRORS) {
    if (!(await prefixExists(mirror.path))) {
      console.log(`  ${mirror.repo}: skipped — no source at ${mirror.path}/`);
      continue;
    }
    if (dryRun) {
      console.log(`  ${mirror.repo}: would tag ${tag} (dry-run)`);
      continue;
    }
    try {
      await tagMirror(mirror.repo, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ${mirror.repo}: FAILED — ${redact(message)}`);
      failed.push(mirror.repo);
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
