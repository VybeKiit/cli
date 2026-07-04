#!/usr/bin/env node
/**
 * One-shot migration: clsx + tailwind-merge cn helpers → cnfast.
 *
 * 1. Rewrites lib/utils.ts barrels to re-export cn from cnfast (shadcn pattern).
 * 2. Replaces inline `export function cn` copies in mirrored UI blocks.
 * 3. Runs `cnfast migrate` to retarget direct clsx / tailwind-merge imports.
 * 4. Adds cnfast and drops clsx + tailwind-merge from consumer package.json files.
 *
 * Usage:
 *   node scripts/dev/codmods/migrateCnfast.mjs
 *   node scripts/dev/codmods/migrateCnfast.mjs --dry-run
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', 'downloads', '.open-next']);

/** Packages that own a cn barrel and/or import clsx / tailwind-merge directly. */
const CONSUMER_PACKAGES = [
  'templates/web',
  'templates/spa',
  'templates/extension',
  'apps/landing',
  'apps/componentLibrary',
];

const UTILS_PATHS = [
  'templates/web/src/lib/utils.ts',
  'templates/spa/src/lib/utils.ts',
  'templates/extension/src/lib/utils.ts',
  'apps/landing/src/lib/utils.ts',
];

const UTILS_REEXPORT = `/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export { cn } from 'cnfast';
`;

const INLINE_CN_FN =
  /export function cn\(\.\.\.inputs: ClassValue\[\]\)\s*\{[^}]*return twMerge\(clsx\(inputs\)\);[^}]*\}\s*\n?/g;

const LEGACY_IMPORT_LINES =
  /^import\s*\{[^}]*\b(?:clsx|twMerge|ClassValue)\b[^}]*\}\s*from\s*['"](?:clsx|tailwind-merge)['"];\s*\n/gm;

function log(msg) {
  console.log(DRY_RUN ? `[dry-run] ${msg}` : msg);
}

function write(path, content) {
  const rel = relative(ROOT, path);
  if (DRY_RUN) {
    log(`would write ${rel}`);
    return;
  }
  writeFileSync(path, content);
  log(`updated ${rel}`);
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|mts|cts)$/.test(name)) files.push(p);
  }
  return files;
}

function stillImportsLegacy(content) {
  return (
    /from\s+['"]clsx['"]/.test(content) ||
    /from\s+['"]tailwind-merge['"]/.test(content) ||
    /from\s+['"]classnames['"]/.test(content)
  );
}

function patchUtilsBarrels() {
  for (const rel of UTILS_PATHS) {
    const path = join(ROOT, rel);
    const current = readFileSync(path, 'utf8');
    if (current.trim() === UTILS_REEXPORT.trim()) {
      log(`skip ${rel} (already cnfast)`);
      continue;
    }
    write(path, UTILS_REEXPORT);
  }
}

function patchInlineCnExports() {
  let changed = 0;
  for (const file of walk(ROOT)) {
    if (!file.includes('/templates/web/src/components/')) continue;
    const before = readFileSync(file, 'utf8');
    if (!INLINE_CN_FN.test(before)) continue;

    let after = before.replace(INLINE_CN_FN, '');
    after = after.replace(LEGACY_IMPORT_LINES, '');
    if (!/export\s*\{[^}]*\bcn\b[^}]*\}\s*from\s*['"]cnfast['"]/.test(after)) {
      const importBlock = after.match(/^(?:"use client";\n\n)?((?:import[\s\S]*?\n\n)+)/);
      if (importBlock) {
        after = after.replace(importBlock[0], `${importBlock[1]}export { cn } from 'cnfast';\n\n`);
      } else {
        after = after.startsWith('"use client";')
          ? after.replace(
              /^"use client";\n\n/,
              '"use client";\n\nexport { cn } from \'cnfast\';\n\n',
            )
          : `export { cn } from 'cnfast';\n\n${after}`;
      }
    }

    write(file, after);
    changed++;
  }
  log(`inline cn exports: ${changed} file(s)`);
}

function patchPackageJsonDeps() {
  for (const rel of CONSUMER_PACKAGES) {
    const path = join(ROOT, rel, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    const deps = pkg.dependencies ?? {};
    delete deps.clsx;
    delete deps['tailwind-merge'];
    deps.cnfast ??= '^0.0.8';
    pkg.dependencies = deps;
    write(path, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

function runCnfastMigrate() {
  const args = ['cnfast', 'migrate', '-y'];
  if (DRY_RUN) args.push('--dry-run');
  log(`running: npx ${args.join(' ')}`);
  if (!DRY_RUN) {
    execSync(`npx ${args.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
  }
}

function verifyNoLegacyImports() {
  const offenders = [];
  for (const file of walk(ROOT)) {
    const content = readFileSync(file, 'utf8');
    if (stillImportsLegacy(content)) offenders.push(relative(ROOT, file));
  }
  if (offenders.length > 0) {
    console.warn(
      `Warning: ${offenders.length} file(s) still import clsx / tailwind-merge / classnames:`,
    );
    for (const f of offenders) console.warn(`  - ${f}`);
    return false;
  }
  log('verified: no legacy clsx / tailwind-merge imports remain');
  return true;
}

function main() {
  log('cnfast migration — rewriting cn barrels');
  patchUtilsBarrels();
  patchInlineCnExports();
  patchPackageJsonDeps();
  if (!DRY_RUN) {
    log('installing cnfast workspace deps');
    execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
  }
  runCnfastMigrate();
  if (!DRY_RUN) {
    verifyNoLegacyImports();
  }
  log('done');
}

main();
