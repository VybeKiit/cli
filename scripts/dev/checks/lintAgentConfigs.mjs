#!/usr/bin/env node
/**
 * Lint VybeKiit-owned agent config (AGENTS.md, CLAUDE.md, .cursor/rules) via agnix.
 * Auto-fixes safe issues, then blocks if fixes are uncommitted or errors remain.
 *
 * Used by `pnpm verify` / pre-push. Run manually: pnpm check:agent-configs
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const agnixBin = join(repoRoot, 'node_modules/.bin/agnix');

function runAgnix(args) {
  const result = spawnSync(agnixBin, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  if (output.trim()) {
    process.stdout.write(`${output}\n`);
  }
  return result;
}

function listChangedFiles() {
  const files = new Set();
  for (const extraArgs of [[], ['--cached']]) {
    const result = spawnSync('git', ['diff', '--name-only', ...extraArgs], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (result.status !== 0 && result.error) {
      continue;
    }
    for (const line of (result.stdout ?? '').split('\n')) {
      const trimmed = line.trim();
      if (trimmed) {
        files.add(trimmed);
      }
    }
  }
  return files;
}

console.log('check:agent-configs — applying agnix safe fixes…');
const before = listChangedFiles();
const fix = runAgnix(['--fix-safe', '.']);
if (fix.error) {
  console.error(`check:agent-configs: failed to run agnix (${fix.error.message})`);
  process.exit(1);
}

const after = listChangedFiles();
const introduced = [...after].filter((file) => !before.has(file));
if (introduced.length > 0) {
  console.error('check:agent-configs: agnix applied fixes — commit these files, then push again:');
  for (const file of introduced) {
    console.error(`  - ${file}`);
  }
  process.exit(1);
}

console.log('check:agent-configs — validating agent configs…');
const validate = runAgnix(['.']);
if (validate.error) {
  console.error(`check:agent-configs: failed to run agnix (${validate.error.message})`);
  process.exit(1);
}

if (validate.status !== 0) {
  console.error(
    'check:agent-configs: agent config lint failed — fix remaining issues (or run `pnpm check:agent-configs:fix`).',
  );
  process.exit(1);
}

console.log('check:agent-configs: ok');
