#!/usr/bin/env node
/**
 * Sync VybeKiit brand SVGs from assets/brand/ into apps and templates.
 *
 * SSOT:
 *   assets/brand/vybekiit-icon.svg           — favicon / app icon (dark tile + white mark)
 *   assets/brand/vybekiit-logo.svg           — transparent white mark for dark surfaces
 *   assets/brand/vybekiit-profile.svg        — square profile/avatar logo
 *   assets/brand/vybekiit-wordmark.svg       — white wordmark for dark surfaces
 *   assets/brand/vybekiit-wordmark-dark.svg  — dark wordmark for light surfaces
 *
 * Usage:
 *   node scripts/syncBrandAssets.mjs [--dry-run]
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const BRAND_DIR = join(REPO_ROOT, 'assets/brand');

/** @type {{ source: string, targets: string[] }[]} */
const SYNC_MAP = [
  {
    source: 'vybekiit-icon.svg',
    targets: [
      'apps/landing/app/icon.svg',
      'apps/componentLibrary/app/icon.svg',
      'templates/web/app/icon.svg',
      'templates/web/public/logo.svg',
      'templates/extension/public/icon/icon.svg',
      'templates/mobile/assets/icon.svg',
      'templates/spa/public/favicon.svg',
      'templates/spa/public/images/logo/logo-icon.svg',
    ],
  },
  {
    source: 'vybekiit-logo.svg',
    targets: [
      'apps/landing/public/vybekiit-logo.svg',
      'apps/localDevelopmentWebsite/public/vybekiit-logo.svg',
      'templates/web/public/vybekiit-logo.svg',
      'templates/extension/public/vybekiit-logo.svg',
    ],
  },
  {
    source: 'vybekiit-profile.svg',
    targets: ['apps/landing/public/vybekiit-profile.svg'],
  },
  {
    source: 'vybekiit-wordmark.svg',
    targets: [
      'apps/landing/public/vybekiit-wordmark.svg',
      'templates/web/public/vybekiit-wordmark.svg',
      'templates/spa/public/images/logo/auth-logo.svg',
      'templates/spa/public/images/logo/logo-dark.svg',
    ],
  },
  {
    source: 'vybekiit-wordmark-dark.svg',
    targets: ['templates/spa/public/images/logo/logo.svg'],
  },
];

const dryRun = process.argv.includes('--dry-run');

/**
 * @param {string} path
 * @returns {Promise<string | null>}
 */
async function readIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/**
 * @param {string} content
 * @returns {string}
 */
function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * @param {string} sourceName
 * @param {string} targetRel
 * @param {string} content
 */
async function syncFile(sourceName, targetRel, content) {
  const targetPath = join(REPO_ROOT, targetRel);
  const existing = await readIfExists(targetPath);
  if (existing === content) {
    return { targetRel, status: 'unchanged' };
  }

  if (dryRun) {
    return { targetRel, status: existing === null ? 'would-create' : 'would-update' };
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, 'utf8');
  return { targetRel, status: existing === null ? 'created' : 'updated' };
}

export async function syncBrandAssets(options = {}) {
  const isDryRun = options.dryRun ?? dryRun;
  /** @type {{ source: string, target: string, status: string }[]} */
  const results = [];

  for (const { source, targets } of SYNC_MAP) {
    const sourcePath = join(BRAND_DIR, source);
    const content = await readFile(sourcePath, 'utf8');

    for (const targetRel of targets) {
      const existing = await readIfExists(join(REPO_ROOT, targetRel));
      if (existing === content) {
        results.push({ source, target: targetRel, status: 'unchanged' });
        continue;
      }

      if (isDryRun) {
        results.push({
          source,
          target: targetRel,
          status: existing === null ? 'would-create' : 'would-update',
        });
        continue;
      }

      const targetPath = join(REPO_ROOT, targetRel);
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content, 'utf8');
      results.push({
        source,
        target: targetRel,
        status: existing === null ? 'created' : 'updated',
      });
    }
  }

  return results;
}

/** @param {string} relPath @returns {Promise<string>} */
export async function readBrandAsset(relPath) {
  return readFile(join(BRAND_DIR, relPath), 'utf8');
}

/** @param {string} relPath @returns {Promise<string>} */
export async function readSyncedTarget(relPath) {
  return readFile(join(REPO_ROOT, relPath), 'utf8');
}

/** @param {string} content @returns {string} */
export function brandAssetHash(content) {
  return sha256(content);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const results = await syncBrandAssets();
  const changed = results.filter((r) => r.status !== 'unchanged');

  if (changed.length === 0) {
    console.log('[sync:brand] All brand assets already in sync.');
  } else {
    console.log(`[sync:brand] ${dryRun ? 'Would sync' : 'Synced'} ${changed.length} file(s):`);
    for (const { source, target, status } of changed) {
      console.log(`  ${status.padEnd(12)} ${target} ← ${source}`);
    }
  }
}
