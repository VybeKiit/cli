#!/usr/bin/env node
/**
 * CI gate: provider dispatch must use resolveEnvProvider (ADR-0018).
 * Scans packages resolve.ts files and cli doctor TypeScript.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const repoRoot = join(import.meta.dirname, '..');

const SCAN_ROOTS = [join(repoRoot, 'packages'), join(repoRoot, 'cli', 'src', 'doctor')];

const ALLOWLIST = new Set([
  // provider-dispatch.ts may compare parsed provider keys for stack helpers
  'packages/core/src/provider-dispatch.ts',
]);

function collectResolveFiles(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (name === 'node_modules' || name === 'dist') continue;
    const st = statSync(path);
    if (st.isDirectory()) {
      collectResolveFiles(path, acc);
    } else if (name === 'resolve.ts' || (dir.endsWith('doctor') && name.endsWith('.ts'))) {
      acc.push(path);
    }
  }
  return acc;
}

const failures = [];

for (const root of SCAN_ROOTS) {
  const files = root.endsWith('doctor')
    ? collectResolveFiles(root)
    : collectResolveFiles(root).filter((f) => f.endsWith('resolve.ts'));

  for (const file of files) {
    const rel = relative(repoRoot, file);
    if (ALLOWLIST.has(rel)) continue;

    const text = readFileSync(file, 'utf8');
    const usesResolve = text.includes('resolveEnvProvider');
    const hasProviderSwitch = /switch\s*\(\s*\w*PROVIDER\w*\s*\)/.test(text);

    if (hasProviderSwitch && !usesResolve) {
      failures.push(`${rel}: switch on *_PROVIDER without resolveEnvProvider`);
    }

    if (/env\.(HOSTING|DATA|STORAGE|EMAIL|AUTH)_PROVIDER\s*===/.test(text)) {
      failures.push(`${rel}: raw env.*_PROVIDER compare — use parseEnv + core helpers`);
    }
  }
}

if (failures.length) {
  console.error('Provider dispatch check failed:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  console.error('\nSee .agents/skills/extend-provider-dispatch/SKILL.md and ADR-0018.');
  process.exit(1);
}

console.log('check-provider-dispatch: ok');
