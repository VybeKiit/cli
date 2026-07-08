#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('pnpm', ['verify'], {
  cwd: templateRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const status = result.status === null ? 1 : result.status;
process.exit(status);
