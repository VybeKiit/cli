#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(templateRoot, '../..');
const script = join(repoRoot, 'scripts/checkAgentPatterns.mjs');

const result = spawnSync('node', [script, '--root', templateRoot], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
