#!/usr/bin/env node
/** Ensure package tsconfig.json sets baseUrl for path mapping from tsconfig.base.json. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = join(repoRootFrom(import.meta.url), 'packages');

for (const name of readdirSync(ROOT)) {
  const tsconfigPath = join(ROOT, name, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) continue;
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
  tsconfig.compilerOptions ??= {};
  if (tsconfig.compilerOptions.baseUrl !== '../..') {
    tsconfig.compilerOptions.baseUrl = '../..';
    writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
  }
}
console.log('Patched package tsconfigs with baseUrl.');
