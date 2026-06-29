#!/usr/bin/env node
/**
 * Audit mirror component dependencies and merge into templates/web/package.json.
 * Called at end of sync-ui-registries.mjs.
 */

import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CATALOG_PATH = join(REPO_ROOT, 'templates/web/.vybekiit/agent/ui-catalog-index.json');
const PKG_PATH = join(REPO_ROOT, 'templates/web/package.json');
const REPORT_PATH = join(REPO_ROOT, 'scripts/ui-registry-deps-report.json');

const FORBIDDEN = ['@heroui/', 'nativewind', '@gluestack-ui/themed'];

/** Strip semver suffix from registry dependency strings like `cobe@^0.6.4`. */
function normalizeDepName(dep) {
  if (!dep || typeof dep !== 'string') return null;
  if (dep.startsWith('@')) {
    const versionAt = dep.lastIndexOf('@');
    if (versionAt > 0) return dep.slice(0, versionAt);
    return dep;
  }
  const versionAt = dep.indexOf('@');
  if (versionAt > 0) return dep.slice(0, versionAt);
  return dep;
}

/** @param {string} name */
function isValidPackageName(name) {
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i.test(name);
}

/**
 * @param {string} range
 * @param {string} latest
 */
function bumpWithinSemver(range, latest) {
  if (!range || range === 'latest' || range === '*') {
    return `^${latest}`;
  }
  const major = range.match(/\d+/)?.[0];
  const latestMajor = latest.split('.')[0];
  if (major && major !== latestMajor) {
    return range;
  }
  if (range.startsWith('^') || range.startsWith('~')) {
    return range;
  }
  return `^${latest}`;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8'));
  const pkg = JSON.parse(await readFile(PKG_PATH, 'utf8'));
  const deps = pkg.dependencies ?? {};

  /** @type {Set<string>} */
  const mirrorDeps = new Set();
  for (const component of catalog.components ?? []) {
    for (const dep of component.dependencies ?? []) {
      const name = normalizeDepName(dep);
      if (name && isValidPackageName(name)) {
        mirrorDeps.add(name);
      }
    }
  }

  /** @type {string[]} */
  const forbidden = [];
  /** @type {Array<{ name: string, action: string, version?: string }>} */
  const changes = [];

  for (const dep of mirrorDeps) {
    if (FORBIDDEN.some((f) => dep.includes(f))) {
      forbidden.push(dep);
      continue;
    }
    try {
      const { stdout } = await exec('npm', ['view', dep, 'version'], { timeout: 30_000 });
      const latest = stdout.trim();
      if (!deps[dep]) {
        deps[dep] = `^${latest}`;
        changes.push({ name: dep, action: 'added', version: deps[dep] });
      } else {
        const next = bumpWithinSemver(deps[dep], latest);
        if (next !== deps[dep]) {
          changes.push({ name: dep, action: 'updated', version: next });
          deps[dep] = next;
        } else {
          changes.push({ name: dep, action: 'skipped', version: deps[dep] });
        }
      }
    } catch {
      changes.push({ name: dep, action: 'skipped', version: deps[dep] });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mirrorDepCount: mirrorDeps.size,
    added: changes.filter((c) => c.action === 'added'),
    updated: changes.filter((c) => c.action === 'updated'),
    skipped: changes.filter((c) => c.action === 'skipped'),
    forbidden,
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (forbidden.length > 0) {
    console.error(`Forbidden mirror deps: ${forbidden.join(', ')}`);
    process.exit(1);
  }

  if (changes.some((c) => c.action === 'added' || c.action === 'updated')) {
    pkg.dependencies = deps;
    await writeFile(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    console.log(
      `audit-mirror-deps: ${report.added.length} added, ${report.updated.length} updated — run pnpm install`,
    );
  } else {
    console.log(`audit-mirror-deps: ${mirrorDeps.size} deps checked, no package.json changes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
