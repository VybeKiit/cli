#!/usr/bin/env node
/**
 * Bump the unified kit release version across the monorepo.
 * Root package.json version is the canonical kit release line (vX.Y.Z tag source).
 * All maintained packages and the CLI share the same semver after bump.
 *
 * Usage: node scripts/bumpKitVersion.mjs patch|minor|major
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const BUMP = process.argv[2];

if (!(BUMP && ['patch', 'minor', 'major'].includes(BUMP))) {
  console.error('Usage: node scripts/bumpKitVersion.mjs <patch|minor|major>');
  process.exit(1);
}

/** @param {string} version */
function bumpSemver(version, type) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }
  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);
  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

/** @param {string} path */
async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/** @param {string} path @param {unknown} data */
async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/** @param {string} version */
async function setPackageVersion(relPath, version) {
  const path = join(REPO_ROOT, relPath);
  const pkg = await readJson(path);
  pkg.version = version;
  await writeJson(path, pkg);
  console.log(`  ${relPath} → ${version}`);
}

/**
 * Collect every package.json under packages/ (top-level or one nested lane
 * like packages/tools/*). Skip plain directories with no package.json.
 *
 * @param {string} packagesRoot
 * @returns {Promise<string[]>} Paths relative to REPO_ROOT.
 */
async function listPackageJsonPaths(packagesRoot) {
  const { access, readdir } = await import('node:fs/promises');
  const { constants } = await import('node:fs');
  const paths = [];

  /** @param {string} absPath @returns {Promise<boolean>} */
  const hasPackageJson = async (absPath) => {
    try {
      await access(join(absPath, 'package.json'), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  };

  const topEntries = await readdir(packagesRoot);
  for (const name of topEntries.sort()) {
    const abs = join(packagesRoot, name);
    if (await hasPackageJson(abs)) {
      paths.push(`packages/${name}/package.json`);
      continue;
    }
    // Nested workspace lane (e.g. packages/tools/assistant-chat) — no package.json on the lane folder.
    let nested = [];
    try {
      nested = await readdir(abs);
    } catch {
      nested = [];
    }
    for (const child of nested.sort()) {
      const childAbs = join(abs, child);
      if (await hasPackageJson(childAbs)) {
        paths.push(`packages/${name}/${child}/package.json`);
      }
    }
  }
  return paths;
}

async function main() {
  const rootPath = join(REPO_ROOT, 'package.json');
  const root = await readJson(rootPath);
  const current = root.version;
  const next = bumpSemver(current, BUMP);
  root.version = next;
  await writeJson(rootPath, root);
  console.log(`Kit release: ${current} → ${next}`);

  const packageJsonPaths = await listPackageJsonPaths(join(REPO_ROOT, 'packages'));
  for (const relPath of packageJsonPaths) {
    await setPackageVersion(relPath, next);
  }
  await setPackageVersion('cli/package.json', next);

  console.log(`\nNext: commit, tag v${next}, mirror, tag mirrors.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
