#!/usr/bin/env node
/**
 * Runs Playwright UI walkthrough tests when PLAYWRIGHT_ENABLED=true or in CI.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const enabled = process.env.PLAYWRIGHT_ENABLED === 'true' || process.env.CI === 'true';

if (!enabled) {
  console.log('Skipping UI walkthrough tests (set PLAYWRIGHT_ENABLED=true to run).');
  process.exit(0);
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
