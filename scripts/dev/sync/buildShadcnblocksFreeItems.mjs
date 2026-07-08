#!/usr/bin/env node
/**
 * One-time maintainer script: probe shadcnblocks registry and save free-tier item names.
 * Run when NOT rate-limited (after 429 cooldown). Slow by design (~350ms/item).
 *
 *   node scripts/buildShadcnblocksFreeItems.mjs
 *
 * Writes: scripts/shadcnblocks-free-items.json
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const OUT_PATH = join(REPO_ROOT, 'scripts/data/shadcnblocks-free-items.json');
const REGISTRY_INDEX = 'https://shadcnblocks.com/r/registry.json';
const ITEM_URL = 'https://shadcnblocks.com/r/{name}.json';
const DELAY_MS = 400;

/**
 * @param {string} url
 * @param {number} [attempt]
 */
async function fetchJson(url, attempt = 0) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429 && attempt < 5) {
    const body = await res.json().catch(() => ({}));
    const retryAfter = Number(body.retryAfter ?? res.headers.get('retry-after') ?? 60);
    console.log(`rate limited — waiting ${retryAfter}s…`);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function main() {
  const registry = await fetchJson(REGISTRY_INDEX);
  const names = (registry.items ?? [])
    .map((item) => item.name)
    .filter((name) => typeof name === 'string');
  console.log(`probing ${names.length} registry items…`);

  /** @type {string[]} */
  const free = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const url = ITEM_URL.replace('{name}', name);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 200) {
        const item = await res.json();
        if (item.files?.some((file) => file.content)) {
          free.push(name);
        }
      }
    } catch {
      // skip
    }
    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/${names.length} — ${free.length} free so far`);
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  await writeFile(OUT_PATH, `${JSON.stringify(free, null, 2)}\n`, 'utf8');
  console.log(`saved ${free.length} free items → scripts/data/shadcnblocks-free-items.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
