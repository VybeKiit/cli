/**
 * Freshness audit catalog for platform skill pins (strict CI — ADR-0007 extension).
 * Providers in {@link PLATFORM_SKILLS_BASE_MANIFEST} must pass repo + npm checks.
 * {@link DOCS_ONLY_PLATFORM_PROVIDERS} must never appear in the base manifest.
 */

export interface PlatformSkillsAuditProvider {
  readonly id: string;
  /** GitHub `owner/repo` or full skills source URL — used in manifest. */
  readonly skillsRepo: string;
  /** GitHub repo for activity checks when different from skills path (e.g. aws toolkit). */
  readonly activityRepo?: string;
  /** npm package to check for SDK freshness; omit when no direct SDK dependency. */
  readonly npmPackage?: string;
}

/** Max days since last GitHub commit before strict CI blocks a pin. */
export const PLATFORM_SKILLS_REPO_MAX_AGE_DAYS = 90;

/** Max days since last npm publish before strict CI blocks a pin. */
export const PLATFORM_SKILLS_NPM_MAX_AGE_DAYS = 180;

/**
 * Providers audited against the base manifest — one entry per pin candidate repo.
 * Skill names live in platform-skills-base.manifest.json; this catalog drives freshness only.
 */
export const PLATFORM_SKILLS_AUDIT_PROVIDERS: readonly PlatformSkillsAuditProvider[] = [
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

/** Providers that must stay docs-only — must not appear in base manifest sources. */
export const DOCS_ONLY_PLATFORM_PROVIDERS: readonly {
  readonly id: string;
  readonly reason: string;
}[] = [
  {
    id: 'lemon-squeezy',
    reason:
      '@lemonsqueezy/lemonsqueezy.js last npm publish Nov 2024 (>180d); no vendor skills.sh repo',
  },
  { id: 'paypal', reason: 'Agent toolkit + MCP only — no vendor skills.sh repo' },
  { id: 'plausible', reason: 'Community skills only — not vendor-maintained' },
  { id: 'wxt', reason: 'No wxt-dev official skills repo' },
];

export type PlatformSkillsAuditStatus = 'pass' | 'warn' | 'block';

export interface PlatformSkillsAuditResult {
  readonly provider: string;
  readonly status: PlatformSkillsAuditStatus;
  readonly reasons: readonly string[];
}

export interface PlatformSkillsAuditInput {
  readonly now: Date;
  readonly repoCommitDates: Readonly<Record<string, Date | null>>;
  readonly npmPublishDates: Readonly<Record<string, Date | null>>;
}

/** Normalize repo keys for lookup (`https://docs.stripe.com` → `docs.stripe.com`). */
export function normalizeSkillsRepoKey(repo: string): string {
  return repo.replace(/^https:\/\//, '').replace(/\/$/, '');
}

function daysBetween(older: Date, newer: Date): number {
  return (newer.getTime() - older.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Pure freshness evaluation — network I/O lives in scripts/audit-platform-skills.mjs.
 */
export function evaluatePlatformSkillsAudit(
  input: PlatformSkillsAuditInput,
): PlatformSkillsAuditResult[] {
  const results: PlatformSkillsAuditResult[] = [];

  for (const provider of PLATFORM_SKILLS_AUDIT_PROVIDERS) {
    const reasons: string[] = [];
    let status: PlatformSkillsAuditStatus = 'pass';

    const repoKey = normalizeSkillsRepoKey(provider.activityRepo ?? provider.skillsRepo);
    const commitDate = input.repoCommitDates[repoKey] ?? input.repoCommitDates[provider.skillsRepo];
    if (commitDate === null || commitDate === undefined) {
      reasons.push(`Could not resolve last commit for ${provider.skillsRepo}`);
      status = 'block';
    } else {
      const repoAge = daysBetween(commitDate, input.now);
      if (repoAge > PLATFORM_SKILLS_REPO_MAX_AGE_DAYS) {
        reasons.push(
          `Vendor repo inactive ${Math.floor(repoAge)}d (max ${PLATFORM_SKILLS_REPO_MAX_AGE_DAYS}d)`,
        );
        status = 'block';
      }
    }

    if (provider.npmPackage) {
      const publishDate = input.npmPublishDates[provider.npmPackage];
      if (publishDate === null || publishDate === undefined) {
        reasons.push(`Could not resolve npm publish date for ${provider.npmPackage}`);
        if (status !== 'block') status = 'warn';
      } else {
        const npmAge = daysBetween(publishDate, input.now);
        if (npmAge > PLATFORM_SKILLS_NPM_MAX_AGE_DAYS) {
          reasons.push(
            `npm ${provider.npmPackage} stale ${Math.floor(npmAge)}d (max ${PLATFORM_SKILLS_NPM_MAX_AGE_DAYS}d)`,
          );
          status = 'block';
        }
      }
    }

    if (reasons.length === 0) {
      reasons.push('Freshness checks passed');
    }

    results.push({ provider: provider.id, status, reasons });
  }

  return results;
}

/** True when any audited provider is blocked. */
export function isPlatformSkillsAuditBlocking(
  results: readonly PlatformSkillsAuditResult[],
): boolean {
  return results.some((r) => r.status === 'block');
}
