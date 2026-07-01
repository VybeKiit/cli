#!/usr/bin/env node
/**
 * Maintainer helper: render agent-layer sections + buyer SKILL.md stubs for all templates.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repoRoot, 'cli/dist/index.js');
const templates = ['web', 'mobile', 'extension', 'backend'];

let failed = false;
for (const template of templates) {
  const cwd = join(repoRoot, 'templates', template);
  const result = spawnSync('node', [cli, 'render-agent-layer', template], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status === 0) {
    const count = (result.stdout || '').trim();
    console.log(`${template}: render-agent-layer ok${count ? ` — ${count}` : ''}`);
  } else {
    failed = true;
    console.error(`\n${template}: render-agent-layer failed\n${result.stdout}\n${result.stderr}`);
  }
}

process.exit(failed ? 1 : 0);
