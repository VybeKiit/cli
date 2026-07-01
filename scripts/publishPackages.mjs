#!/usr/bin/env node
/**
 * Publish all maintained @vybekiit/* packages to npm (issue #17).
 * Requires NPM_TOKEN in env and write access to @vybekiit org.
 *
 * Usage: pnpm publish:packages [--dry-run]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

// Folder names under packages/ (camelCase). The published @vybekiit/* name is read
// from each package.json, so the directory and the npm name can differ (e.g. the
// folder `agentKit` publishes as `@vybekiit/agent-kit`).
const PACKAGE_DIRS = [
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
  'agentKit',
  'clientState',
  'http',
  'browserAutomation',
  'reportMode',
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
  'uiCatalogMcp',
];

const dryRun = process.argv.includes('--dry-run');

for (const dir of PACKAGE_DIRS) {
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
