#!/usr/bin/env node
/**
 * Publish the maintained @vybekiit/* spine to npm (issue #17; ADR-0025 → 5 published).
 * The set is DERIVED, not hard-coded: every `packages/*` whose package.json is not
 * `private: true`. Privatizing or deleting a package removes it from the release with
 * no list here to edit — the one source of truth is each package's own `private` flag.
 * Requires OIDC trusted publishing (see publish.yml) and write access to @vybekiit.
 *
 * Usage: pnpm publish:packages [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import process from 'node:process';

const dryRun = process.argv.includes('--dry-run');

/** Folder names under packages/ whose package.json is published (not `private: true`). */
function publishableDirs() {
  return readdirSync('packages')
    .filter((dir) => existsSync(`packages/${dir}/package.json`))
    .filter(
      (dir) => JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8')).private !== true,
    )
    .sort();
}

const dirs = publishableDirs();
console.log(`Publishing ${dirs.length} package(s): ${dirs.join(', ')}`);

for (const dir of dirs) {
  const cwd = `packages/${dir}`;
  const { name } = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
  console.log(`Publishing ${name}...`);
  const result = spawnSync(
    'pnpm',
    ['publish', '--access', 'public', '--no-git-checks', ...(dryRun ? ['--dry-run'] : [])],
    { cwd, stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) {
    console.error(`Failed to publish ${name}`);
    process.exit(1);
  }
}

console.log('CLI package (vybekiit) — publish separately from cli/ if needed.');
