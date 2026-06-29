#!/usr/bin/env node
/**
 * Publish all maintained @vybekiit/* packages to npm (issue #17).
 * Requires NPM_TOKEN in env and write access to @vybekiit org.
 *
 * Usage: pnpm publish:packages [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const PACKAGES = [
  'core',
  'payments',
  'auth',
  'db',
  'deploy',
  'email',
  'tokens',
  'observability',
  'security',
  'assets',
  'agent-kit',
  'extension-publish',
  'report-mode',
  'i18n',
  'seo',
  'compliance',
  'kv',
  'analytics',
  'jobs',
  'notifications',
  'search',
  'realtime',
  'tenancy',
  'ai',
  'cms',
];

const dryRun = process.argv.includes('--dry-run');

for (const name of PACKAGES) {
  const dir = `packages/${name}`;
  console.log(`Publishing @vybekiit/${name}...`);
  const result = spawnSync(
    'pnpm',
    ['publish', '--access', 'public', '--no-git-checks', ...(dryRun ? ['--dry-run'] : [])],
    { cwd: dir, stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) {
    console.error(`Failed to publish @vybekiit/${name}`);
    process.exit(1);
  }
}

console.log('CLI package (vybekiit) — publish separately from cli/ if needed.');
