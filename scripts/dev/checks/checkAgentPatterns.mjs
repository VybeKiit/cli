#!/usr/bin/env node
/**
 * Maintainer runner: agent-pattern checks for every shipped template.
 * Usage: node scripts/dev/checks/checkAgentPatterns.mjs [--strict]
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const templates = ['web', 'spa', 'mobile', 'extension', 'backend'];
const extraArgs = process.argv.slice(2);
let failed = false;

for (const template of templates) {
  const root = join(repoRoot, 'templates', template);
  const script = join(root, 'scripts/checkAgentPatterns.mjs');
  const result = spawnSync('node', [script, '--root', root, ...extraArgs], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    failed = true;
    console.error(`checkAgentPatterns failed for templates/${template}`);
  }
}

process.exit(failed ? 1 : 0);
