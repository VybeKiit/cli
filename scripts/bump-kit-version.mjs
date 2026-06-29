#!/usr/bin/env node
/**
 * Bump the unified kit release version across the monorepo.
 * Root package.json version is the canonical kit release line (vX.Y.Z tag source).
 * All maintained packages and the CLI share the same semver after bump.
 *
 * Usage: node scripts/bump-kit-version.mjs patch|minor|major
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const BUMP = process.argv[2];

if (!BUMP || !['patch', 'minor', 'major'].includes(BUMP)) {
  console.error('Usage: node scripts/bump-kit-version.mjs <patch|minor|major>');
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

async function main() {
  const rootPath = join(REPO_ROOT, 'package.json');
  const root = await readJson(rootPath);
  const current = root.version;
  const next = bumpSemver(current, BUMP);
  root.version = next;
  await writeJson(rootPath, root);
  console.log(`Kit release: ${current} → ${next}`);

  const { readdir } = await import('node:fs/promises');
  const packages = await readdir(join(REPO_ROOT, 'packages'));
  for (const name of packages.sort()) {
    await setPackageVersion(`packages/${name}/package.json`, next);
  }
  await setPackageVersion('cli/package.json', next);

  console.log(`\nNext: commit, tag v${next}, mirror, tag mirrors.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
