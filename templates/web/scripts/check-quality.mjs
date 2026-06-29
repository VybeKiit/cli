#!/usr/bin/env node
/**
 * Runs the full quality smoke — format, lint, typecheck, tests.
 * Usage: node scripts/check-quality.mjs (from template root or any cwd)
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('pnpm', ['quality'], {
  cwd: templateRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
