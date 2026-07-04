#!/usr/bin/env node
/**
 * Run Playwright e2e smoke tests for every buyer template (+ component library).
 * Set PLAYWRIGHT_ENABLED=true locally; CI always runs.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);

const TARGETS = [
  { label: 'web', cwd: 'templates/web', build: null },
  { label: 'spa', cwd: 'templates/spa', build: 'pnpm build' },
  { label: 'backend', cwd: 'templates/backend', build: null },
  { label: 'extension', cwd: 'templates/extension', build: null },
  { label: 'mobile', cwd: 'templates/mobile', build: null },
  { label: 'component-library', cwd: 'apps/componentLibrary', build: 'pnpm build' },
];

const enabled = process.env.PLAYWRIGHT_ENABLED === 'true' || process.env.CI === 'true';
if (!enabled) {
  console.log('Skipping template e2e (set PLAYWRIGHT_ENABLED=true to run).');
  process.exit(0);
}

let failed = false;

for (const target of TARGETS) {
  const cwd = resolve(ROOT, target.cwd);
  console.log(`\n=== e2e: ${target.label} ===`);
  if (target.build) {
    const buildParts = target.build.split(' ');
    const build = spawnSync(buildParts[0], buildParts.slice(1), {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, PLAYWRIGHT_ENABLED: 'true', CI: process.env.CI ?? 'true' },
    });
    if ((build.status ?? 1) !== 0) {
      failed = true;
      continue;
    }
  }
  const run = spawnSync('pnpm', ['test:e2e'], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PLAYWRIGHT_ENABLED: 'true', CI: process.env.CI ?? 'true' },
  });
  if ((run.status ?? 1) !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
