#!/usr/bin/env node
/** Codemod imports after domain package promotion. */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const SKIP = new Set(['node_modules', 'dist', '.next', '.turbo', 'downloads']);

const DOMAIN_RE =
  /@\/vybekiit\/([a-zA-Z0-9-]+)(\/[^'"]*)?|from ['"](\.\.\/)+http\/responseSchemas['"]|from ['"]@vybekiit\/core\/http\/responseSchemas['"]/g;

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

function pkgNameForFile(file) {
  const rel = relative(join(ROOT, 'packages'), file);
  if (!rel.startsWith('..')) return rel.split('/')[0];
  return null;
}

function resolveRelativeImport(fromFile, spec) {
  if (!spec.startsWith('../')) return null;
  const pkg = pkgNameForFile(fromFile);
  if (!pkg) return null;
  const fromDir = dirname(fromFile);
  const target = resolve(fromDir, spec);
  const srcRoot = join(ROOT, 'packages', pkg, 'src');
  if (!target.startsWith(srcRoot)) return null;
  const relPath = relative(srcRoot, target).replace(/\.tsx?$/, '');
  return `@vybekiit/${pkg}/${relPath}`;
}

function transform(content, file) {
  let out = content;

  // Template alias: @/vybekiit/foo → @vybekiit/foo
  out = out.replace(/@\/vybekiit\//g, '@vybekiit/');

  // responseSchemas → core/http
  out = out.replace(/from ['"](?:\.\.\/)+http\/responseSchemas['"]/g, "from '@vybekiit/core/http'");
  out = out.replace(
    /from ['"]@vybekiit\/core\/http\/responseSchemas['"]/g,
    "from '@vybekiit/core/http'",
  );

  // Package parent imports → scoped (keep ./ same-folder)
  out = out.replace(/from ['"](\.\.\/[^'"]+)['"]/g, (match, spec) => {
    if (!spec.startsWith('../')) return match;
    const scoped = resolveRelativeImport(file, spec);
    return scoped ? `from '${scoped}'` : match;
  });

  // Backend relative vybekiit
  out = out.replace(/from ['"]\.\.\/vybekiit\/([^'"]+)['"]/g, "from '@vybekiit/$1'");

  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.includes('/templates/web/src/components/')) continue;
  const before = readFileSync(file, 'utf8');
  const after = transform(before, file);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
console.log(`Codemod updated ${changed} files.`);
