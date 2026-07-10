#!/usr/bin/env node
/**
 * Upload landing brand marks / logos to Cloudflare R2 as public objects.
 *
 * Sources: apps/landing/public/{brand-marks,brand-marks-3d,vybekiit-*}
 * Prefer WebP; skip SVG when a same-basename WebP exists.
 * Cache-Control: public, max-age=86400 (1 day) + stale-while-revalidate=86400.
 *
 * Auth: wrangler OAuth (Library/Preferences/.wrangler/config/default.toml).
 * Does not use CLOUDFLARE_API_TOKEN from .env.local (often Workers-only).
 *
 * Usage:
 *   node apps/landing/scripts/uploadBrandMarksToR2.mjs
 *   pnpm --filter vybekiit-landing upload-assets:r2
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '../public');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? 'b0ba5fea46c96d72bfc6f12e1dafaf7b';
const BUCKET = process.env.R2_BUCKET ?? 'vybekiit-landing-assets';
const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_ASSETS_BASE_URL ??
  process.env.R2_PUBLIC_URL ??
  'https://pub-e43389539f974d69b9ec3c1fb0f08dd6.r2.dev';
const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=86400';
const CONCURRENCY = 8;

/**
 * @returns {string}
 */
const readWranglerOauthToken = () => {
  const cfgPath = join(homedir(), 'Library/Preferences/.wrangler/config/default.toml');
  const cfg = readFileSync(cfgPath, 'utf8');
  const match = cfg.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (match === null || match[1] === undefined || match[1] === '') {
    throw new Error(
      'No wrangler OAuth token found. Run `npx wrangler login` then re-run this script.',
    );
  }
  return match[1];
};

/**
 * @param {string} dir
 * @returns {string[]}
 */
const walk = (dir) => {
  /** @type {string[]} */
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
};

/**
 * @param {string} file
 * @returns {string}
 */
const contentTypeFor = (file) => {
  const ext = extname(file).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
};

/**
 * @param {string} rel
 * @returns {boolean}
 */
const isUploadCandidate = (rel) => {
  const ext = extname(rel).toLowerCase();
  if (!(ext === '.webp' || ext === '.svg' || ext === '.png')) {
    return false;
  }
  if (rel.startsWith('brand-marks/') || rel.startsWith('brand-marks-3d/')) {
    return true;
  }
  if (rel.startsWith('vybekiit-')) {
    return true;
  }
  return false;
};

/**
 * @param {string} oauth
 * @param {string} key
 * @param {Buffer} body
 * @param {string} contentType
 * @returns {Promise<{ ok: boolean, status: number, text: string }>}
 */
const putObject = async (oauth, key, body, contentType) => {
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodedKey}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${oauth}`,
      'Content-Type': contentType,
      'Cache-Control': CACHE_CONTROL,
    },
    body,
  });
  const text = res.ok ? '' : await res.text();
  return { ok: res.ok, status: res.status, text: text.slice(0, 240) };
};

/**
 * Ensure the managed r2.dev public domain is enabled.
 *
 * @param {string} oauth
 * @returns {Promise<string>}
 */
const ensurePublicDomain = async (oauth) => {
  const headers = {
    Authorization: `Bearer ${oauth}`,
    'Content-Type': 'application/json',
  };
  const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}`;

  const createRes = await fetch(`${base}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: BUCKET }),
  });
  // 409 / already exists is fine
  void createRes;

  const enableRes = await fetch(`${base}/domains/managed`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ enabled: true }),
  });
  const enableJson = await enableRes.json();
  const domain = enableJson?.result?.domain;
  if (typeof domain === 'string' && domain.length > 0) {
    return `https://${domain}`;
  }
  return PUBLIC_BASE.replace(/\/$/, '');
};

const main = async () => {
  const oauth = readWranglerOauthToken();
  const publicBase = await ensurePublicDomain(oauth);

  const all = walk(publicDir)
    .map((full) => ({ full, rel: relative(publicDir, full).replaceAll('\\', '/') }))
    .filter(({ rel }) => isUploadCandidate(rel));

  /** @type {Map<string, string>} */
  const byKey = new Map();
  for (const { full, rel } of all) {
    const ext = extname(rel).toLowerCase();
    if (ext === '.svg' || ext === '.png') {
      const webpRel = `${rel.slice(0, -ext.length)}.webp`;
      if (all.some((entry) => entry.rel === webpRel)) {
        continue;
      }
    }
    byKey.set(rel, full);
  }

  const entries = [...byKey.entries()];
  let ok = 0;
  let fail = 0;
  /** @type {{ key: string, status: number, text: string }[]} */
  const failures = [];
  let idx = 0;

  const worker = async () => {
    while (idx < entries.length) {
      const current = idx;
      idx += 1;
      const pair = entries[current];
      if (pair === undefined) return;
      const [key, file] = pair;
      const body = readFileSync(file);
      const result = await putObject(oauth, key, body, contentTypeFor(file));
      if (result.ok) {
        ok += 1;
      } else {
        fail += 1;
        failures.push({ key, status: result.status, text: result.text });
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  process.stdout.write(
    `[upload-assets:r2] bucket=${BUCKET} ok=${ok} fail=${fail} base=${publicBase}\n`,
  );
  process.stdout.write(
    `[upload-assets:r2] set NEXT_PUBLIC_ASSETS_BASE_URL=${publicBase} (default already baked in cdnAssets.ts)\n`,
  );
  if (failures.length > 0) {
    for (const item of failures.slice(0, 10)) {
      process.stdout.write(`  fail ${item.key} ${item.status} ${item.text}\n`);
    }
    process.exitCode = 1;
  }
};

await main();
