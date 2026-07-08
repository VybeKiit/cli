#!/usr/bin/env node
/** Convert parent-relative imports to @vybekiit/<pkg>/ scoped paths in packages/. */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = join(repoRootFrom(import.meta.url), 'packages');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

function pkgFor(file) {
  return relative(ROOT, file).split('/')[0];
}

let changed = 0;
for (const file of walk(ROOT)) {
  const pkg = pkgFor(file);
  const srcRoot = join(ROOT, pkg, 'src');
  const content = readFileSync(file, 'utf8');
  const next = content.replace(/from ['"](\.\.\/[^'"]+)['"]/g, (match, spec) => {
    const target = resolve(dirname(file), spec);
    if (!target.startsWith(srcRoot)) return match;
    const rel = relative(srcRoot, target).replace(/\.tsx?$/, '');
    return `from '@vybekiit/${pkg}/${rel}'`;
  });
  if (next !== content) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log(`Package self-import codemod: ${changed} files.`);
