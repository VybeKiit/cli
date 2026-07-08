#!/usr/bin/env node
/**
 * Runs Playwright extension walkthrough tests when PLAYWRIGHT_ENABLED=true or in CI.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const enabled = process.env.PLAYWRIGHT_ENABLED === 'true' || process.env.CI === 'true';

if (!enabled) {
  process.stdout.write('Skipping UI walkthrough tests (set PLAYWRIGHT_ENABLED=true to run).\n');
  process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const status = result.status === null ? 1 : result.status;
process.exit(status);
