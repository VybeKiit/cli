#!/usr/bin/env node
/** Build SPA before Playwright preview when CI runs e2e. */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const enabled = process.env.PLAYWRIGHT_ENABLED === 'true' || process.env.CI === 'true';

if (!enabled) {
  process.stdout.write('Skipping UI walkthrough tests (set PLAYWRIGHT_ENABLED=true to run).\n');
  process.exit(0);
}

if (process.env.CI === 'true') {
  const build = spawnSync('pnpm', ['build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const buildStatus = build.status === null ? 1 : build.status;
  if (buildStatus !== 0) {
    process.exit(buildStatus);
  }
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const status = result.status === null ? 1 : result.status;
process.exit(status);
