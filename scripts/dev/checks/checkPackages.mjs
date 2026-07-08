#!/usr/bin/env node
/**
 * CI gate: every workspace package declares a valid `vybekiit.kind`, and its shape matches its kind
 * (ADR-0035 package kinds). Kind drives which CODE-STYLE rules apply — only `concern` earns the full
 * provider skeleton; only `tooling` may `console` (the console rule itself is enforced by biome).
 * Reinforces ADR-0033: every package is `private: true` with no `publishConfig`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const VALID_KINDS = new Set(['concern', 'library', 'owned', 'tooling']);

/**
 * Collect every package directory under packages/ (one level, plus packages/tools/*).
 *
 * @returns {string[]} absolute package directory paths that contain a package.json
 */
function collectPackageDirs() {
  const dirs = [];
  const packagesRoot = join(repoRoot, 'packages');
  for (const name of readdirSync(packagesRoot)) {
    if (name === 'node_modules') continue;
    const dir = join(packagesRoot, name);
    if (name === 'tools') {
      for (const inner of readdirSync(dir)) {
        if (existsSync(join(dir, inner, 'package.json'))) dirs.push(join(dir, inner));
      }
      continue;
    }
    if (existsSync(join(dir, 'package.json'))) dirs.push(dir);
  }
  return dirs;
}

const failures = [];

for (const dir of collectPackageDirs()) {
  const rel = relative(repoRoot, dir);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const kind = pkg.vybekiit?.kind;

  if (!VALID_KINDS.has(kind)) {
    failures.push(`${rel}: missing or invalid "vybekiit.kind" (expected one of ${[...VALID_KINDS].join(', ')})`);
    continue;
  }
  if (pkg.private !== true) failures.push(`${rel}: must be "private": true (ADR-0033)`);
  if (pkg.publishConfig) failures.push(`${rel}: no package publishes — remove "publishConfig" (ADR-0033)`);

  // A `concern` is a provider seam: it must carry the resolve.ts + index.ts skeleton anchors.
  if (kind === 'concern') {
    for (const anchor of ['src/resolve.ts', 'src/index.ts']) {
      if (!existsSync(join(dir, anchor))) {
        failures.push(`${rel}: kind "concern" but missing ${anchor} (provider skeleton)`);
      }
    }
  }
}

if (failures.length) {
  console.error(`check-packages failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  console.error('\nSee CODE-STYLE.md "Package kinds" and ADR-0035.');
  process.exit(1);
}

console.log(`check-packages: ok (${collectPackageDirs().length} packages)`);
