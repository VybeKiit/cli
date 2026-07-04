#!/usr/bin/env node
/**
 * Strict CI freshness gate for platform skill pins (90d repo / 180d npm).
 * Runs before pin-platform-skills in quality + pre-push.
 *
 * Uses GITHUB_TOKEN/GH_TOKEN when set (CI). Falls back to committed audit cache
 * when the GitHub API is rate-limited.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const REPO_ROOT = repoRootFrom(import.meta.url);
const BASE_MANIFEST_PATH = join(
  REPO_ROOT,
  'packages/agentKit/src/catalogs/platform-skills-base.manifest.json',
);
const CACHE_PATH = join(
  REPO_ROOT,
  'packages/agentKit/src/catalogs/platform-skills-audit-cache.json',
);

const REPO_MAX_AGE_DAYS = 90;
const NPM_MAX_AGE_DAYS = 180;

/** @typedef {{ id: string, skillsRepo: string, activityRepo?: string, npmPackage?: string }} AuditProvider */

/** @type {readonly AuditProvider[]} */
const AUDIT_PROVIDERS = [
  { id: 'nextjs', skillsRepo: 'vercel-labs/agent-skills' },
  { id: 'supabase', skillsRepo: 'supabase/agent-skills', npmPackage: '@supabase/supabase-js' },
  { id: 'cloudflare', skillsRepo: 'cloudflare/skills' },
  {
    id: 'better-auth',
    skillsRepo: 'better-auth/skills',
    activityRepo: 'better-auth/better-auth',
    npmPackage: 'better-auth',
  },
  { id: 'stripe', skillsRepo: 'docs.stripe.com', npmPackage: 'stripe' },
  { id: 'resend', skillsRepo: 'resend/resend-skills', npmPackage: 'resend' },
  { id: 'resend-email', skillsRepo: 'resend/email-best-practices' },
  { id: 'sentry', skillsRepo: 'getsentry/sentry-for-ai', npmPackage: '@sentry/nextjs' },
  { id: 'posthog', skillsRepo: 'posthog/ai-plugin', npmPackage: 'posthog-js' },
  { id: 'neon', skillsRepo: 'neondatabase/agent-skills' },
  { id: 'firebase', skillsRepo: 'firebase/agent-skills' },
  {
    id: 'aws',
    skillsRepo: 'aws/agent-toolkit-for-aws/skills',
    activityRepo: 'aws/agent-toolkit-for-aws',
  },
  { id: 'mongodb', skillsRepo: 'mongodb/agent-skills' },
  { id: 'railway', skillsRepo: 'railwayapp/railway-skills', npmPackage: '@railway/cli' },
];

const DOCS_ONLY_IDS = ['lemon-squeezy', 'paypal', 'plausible', 'wxt'];

/**
 * @param {string} repo
 * @returns {string}
 */
function normalizeRepoKey(repo) {
  return repo.replace(/^https:\/\//, '').replace(/\/$/, '');
}

/**
 * @returns {Record<string, string>}
 */
function loadAuditCache() {
  try {
    const raw = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    return raw.repoCommitDates ?? {};
  } catch {
    return {};
  }
}

/**
 * @param {string} skillsRepo
 * @returns {string | null}
 */
function githubApiPath(skillsRepo) {
  const normalized = normalizeRepoKey(skillsRepo);
  if (normalized === 'docs.stripe.com') {
    return null;
  }
  if (normalized.includes('/')) {
    return `https://api.github.com/repos/${normalized}/commits?per_page=1`;
  }
  return null;
}

/**
 * @param {string} url
 * @returns {Promise<Date | null>}
 */
async function fetchLastCommitDate(url) {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vybekiit-audit',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const commit = Array.isArray(data) ? data[0] : data;
    const dateStr = commit?.commit?.committer?.date ?? commit?.commit?.author?.date;
    return dateStr ? new Date(dateStr) : null;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<Date | null>}
 */
async function fetchStripeSkillsFreshness() {
  try {
    const res = await fetch('https://docs.stripe.com/.well-known/skills/index.json', {
      headers: { 'User-Agent': 'vybekiit-audit' },
    });
    if (!res.ok) return null;
    const modified = res.headers.get('last-modified');
    return modified ? new Date(modified) : new Date();
  } catch {
    return null;
  }
}

/**
 * @param {string} pkg
 * @returns {Date | null}
 */
function fetchNpmPublishDate(pkg) {
  const result = spawnSync('npm', ['view', pkg, 'time.modified', '--json'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  const raw = (result.stdout ?? '').trim().replace(/^"|"$/g, '');
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {Date} older
 * @param {Date} newer
 * @returns {number}
 */
function daysBetween(older, newer) {
  return (newer.getTime() - older.getTime()) / (1000 * 60 * 60 * 24);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {boolean} writeCache
 * @returns {Promise<{ results: { provider: string, status: string, reasons: string[] }[], cacheUpdates: Record<string, string> }>}
 */
async function runAudit(writeCache) {
  const now = new Date();
  const cache = loadAuditCache();
  /** @type {Record<string, string>} */
  const cacheUpdates = { ...cache };
  /** @type {{ provider: string, status: string, reasons: string[] }[]} */
  const results = [];

  for (const provider of AUDIT_PROVIDERS) {
    /** @type {string[]} */
    const reasons = [];
    let status = 'pass';

    const activityRepo = provider.activityRepo ?? provider.skillsRepo;
    const repoKey = normalizeRepoKey(activityRepo);

    let commitDate = null;
    let usedCache = false;

    if (repoKey === 'docs.stripe.com') {
      commitDate = await fetchStripeSkillsFreshness();
    } else {
      const apiPath = githubApiPath(activityRepo);
      if (apiPath) {
        commitDate = await fetchLastCommitDate(apiPath);
        await sleep(300);
      }
    }

    if (!commitDate && cache[repoKey]) {
      commitDate = new Date(cache[repoKey]);
      usedCache = true;
    }

    if (commitDate) {
      if (!usedCache && writeCache) {
        cacheUpdates[repoKey] = commitDate.toISOString();
      }
      const repoAge = daysBetween(commitDate, now);
      if (repoAge > REPO_MAX_AGE_DAYS) {
        reasons.push(
          `Vendor repo inactive ${Math.floor(repoAge)}d (max ${REPO_MAX_AGE_DAYS}d)${usedCache ? ' (cache)' : ''}`,
        );
        status = 'block';
      } else if (usedCache) {
        reasons.push('Freshness checks passed (audit cache)');
      }
    } else {
      reasons.push(`Could not resolve last activity for ${provider.skillsRepo}`);
      status = 'block';
    }

    if (provider.npmPackage) {
      const publishDate = fetchNpmPublishDate(provider.npmPackage);
      if (publishDate) {
        const npmAge = daysBetween(publishDate, now);
        if (npmAge > NPM_MAX_AGE_DAYS) {
          reasons.push(
            `npm ${provider.npmPackage} stale ${Math.floor(npmAge)}d (max ${NPM_MAX_AGE_DAYS}d)`,
          );
          status = 'block';
        }
      } else {
        reasons.push(`Could not resolve npm publish date for ${provider.npmPackage}`);
        if (status !== 'block') status = 'warn';
      }
    }

    if (reasons.length === 0) {
      reasons.push('Freshness checks passed');
    }

    results.push({ provider: provider.id, status, reasons });
  }

  if (writeCache) {
    writeFileSync(
      CACHE_PATH,
      `${JSON.stringify({ updatedAt: now.toISOString(), repoCommitDates: cacheUpdates }, null, 2)}\n`,
    );
  }

  return { results, cacheUpdates };
}

function checkDocsOnlyNotInBaseManifest() {
  const base = JSON.parse(readFileSync(BASE_MANIFEST_PATH, 'utf8'));
  const violations = [];
  for (const source of base.sources ?? []) {
    for (const id of DOCS_ONLY_IDS) {
      if (source.repo.toLowerCase().includes(id.replace('-', ''))) {
        violations.push(`docs-only provider ${id} must not be in base manifest: ${source.repo}`);
      }
      if (source.repo.toLowerCase().includes(id)) {
        violations.push(`docs-only provider ${id} must not be in base manifest: ${source.repo}`);
      }
    }
  }
  return violations;
}

async function main() {
  const jsonMode = process.argv.includes('--json');
  const writeCache = process.argv.includes('--write-cache');
  const docsOnlyViolations = checkDocsOnlyNotInBaseManifest();
  const { results } = await runAudit(writeCache);
  const blocked = results.filter((r) => r.status === 'block');
  const report = {
    results,
    docsOnlyViolations,
    ok: blocked.length === 0 && docsOnlyViolations.length === 0,
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const r of results) {
      const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '→' : '✗';
      console.log(`${icon} ${r.provider} — ${r.reasons.join('; ')}`);
    }
    if (docsOnlyViolations.length > 0) {
      for (const v of docsOnlyViolations) {
        console.error(`✗ manifest — ${v}`);
      }
    }
  }

  if (!report.ok) {
    if (!jsonMode) {
      console.error(
        `\ncheck:platform-skills-audit failed — ${blocked.length} blocked provider(s), ${docsOnlyViolations.length} manifest violation(s).`,
      );
    }
    process.exitCode = 1;
  } else if (!jsonMode) {
    console.log('check:platform-skills-audit: ok');
  }
}

main();
