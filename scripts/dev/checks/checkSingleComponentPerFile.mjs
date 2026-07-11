#!/usr/bin/env node
/**
 * CI gate: one React component per `.tsx` file (PascalCase authoring rule).
 *
 * Scans page-recipe sources. `index.tsx` barrels that only re-export are allowed.
 * Types, constants, and plain helpers may colocate; multiple `export const Foo =`
 * / `export function Foo` component declarations fail the gate.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);

/** Roots that must stay single-component-per-file. */
const SCAN_ROOTS = [join(repoRoot, 'apps/componentLibrary/src/pageRecipes')];

/**
 * Collect every `.tsx` file under a directory (recursive).
 *
 * @param {string} dir Absolute directory.
 * @param {string[]} [acc] Accumulator.
 * @returns {string[]} Absolute file paths.
 */
export const collectTsxFiles = (dir, acc = []) => {
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
      collectTsxFiles(path, acc);
    } else if (name.endsWith('.tsx') && !name.endsWith('.test.tsx')) {
      acc.push(path);
    }
  }
  return acc;
};

/**
 * True when a file is only a re-export barrel (no local component bodies).
 *
 * @param {string} source File contents.
 * @returns {boolean}
 * @example
 * isReExportBarrel("export { Foo } from './Foo';\n") // → true
 */
export const isReExportBarrel = (source) => {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('/*'));
  if (lines.length === 0) return true;
  return lines.every(
    (line) =>
      line.startsWith('export ') &&
      (line.includes(' from ') || line.startsWith('export type ') || line.startsWith('export * ')),
  );
};

/**
 * Count exported React component declarations in a source string.
 *
 * Matches:
 *   export const Foo = …
 *   export function Foo(…
 *   export const Foo: FC = …
 *
 * Skips lowercase-starting names (helpers/hooks) and type-only exports.
 *
 * @param {string} source File contents.
 * @returns {string[]} Component names found.
 * @example
 * findExportedComponents("export const InfoRow = () => null;\nexport const Page = () => null;")
 * // → ['InfoRow', 'Page']
 */
export const findExportedComponents = (source) => {
  const names = [];
  // export const CustomerDetailPage = … / export const Foo: SomeType = …
  // input → match CustomerDetailPage; useAsync skipped (lowercase start)
  const constComponent =
    /export\s+const\s+([A-Z][A-Za-z0-9]*)\s*(?::[^=]+)?=\s*(?:\(|async\s*\(|React\.forwardRef|forwardRef|memo\s*\()/g;
  // export function CustomerDetailPage(
  const functionComponent = /export\s+(?:async\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*[<(]/g;

  for (const re of [constComponent, functionComponent]) {
    re.lastIndex = 0;
    let match = re.exec(source);
    while (match !== null) {
      const name = match[1];
      if (name !== undefined && !names.includes(name)) {
        names.push(name);
      }
      match = re.exec(source);
    }
  }
  return names;
};

/**
 * Scan configured roots and return violations.
 *
 * @param {{ readonly roots?: readonly string[] }} [options]
 * @returns {{ readonly path: string, readonly components: readonly string[] }[]}
 */
export const findMultiComponentFiles = (options = {}) => {
  const roots = options.roots ?? SCAN_ROOTS;
  const violations = [];
  for (const root of roots) {
    for (const file of collectTsxFiles(root)) {
      const source = readFileSync(file, 'utf8');
      if (isReExportBarrel(source)) continue;
      const components = findExportedComponents(source);
      if (components.length > 1) {
        violations.push({
          path: relative(repoRoot, file),
          components,
        });
      }
    }
  }
  return violations;
};

/**
 * CLI entry — exit 1 when any file exports more than one component.
 *
 * @returns {void}
 */
export const main = () => {
  const violations = findMultiComponentFiles();
  if (violations.length === 0) {
    console.log('Single-component-per-file: ok.');
    return;
  }
  console.error('Single-component-per-file violations (one React component per .tsx file):');
  for (const item of violations) {
    console.error(`  ${item.path}: ${item.components.join(', ')}`);
  }
  process.exit(1);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
