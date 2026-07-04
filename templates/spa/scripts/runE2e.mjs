#!/usr/bin/env node
/** Build SPA before Playwright preview when CI runs e2e. */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const enabled = process.env.PLAYWRIGHT_ENABLED === 'true' || process.env.CI === 'true';

if (!enabled) {
  console.log('Skipping UI walkthrough tests (set PLAYWRIGHT_ENABLED=true to run).');
  process.exit(0);
}

if (process.env.CI === 'true') {
  const build = spawnSync('pnpm', ['build'], { stdio: 'inherit', shell: process.platform === 'win32' });
  if ((build.status ?? 1) !== 0) process.exit(build.status ?? 1);
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
