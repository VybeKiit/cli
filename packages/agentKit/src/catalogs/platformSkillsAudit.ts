/**
 * Freshness audit catalog for platform skill pins (strict CI — ADR-0007 extension).
 * Providers in {@link PLATFORM_SKILLS_BASE_MANIFEST} must pass repo + npm checks.
 * {@link DOCS_ONLY_PLATFORM_PROVIDERS} must never appear in the base manifest.
 */

export type PlatformSkillsAuditProvider = {
  readonly id: string;
  /** GitHub `owner/repo` or full skills source URL — used in manifest. */
  readonly skillsRepo: string;
  /** GitHub repo for activity checks when different from skills path (e.g. aws toolkit). */
  readonly activityRepo?: string;
  /** npm package to check for SDK freshness; omit when no direct SDK dependency. */
  readonly npmPackage?: string;
};

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

export type PlatformSkillsAuditResult = {
  readonly provider: string;
  readonly status: PlatformSkillsAuditStatus;
  readonly reasons: readonly string[];
};

export type PlatformSkillsAuditInput = {
  readonly now: Date;
  readonly repoCommitDates: Readonly<Record<string, Date | null>>;
  readonly npmPublishDates: Readonly<Record<string, Date | null>>;
};

type ProviderFreshnessEvaluation = {
  readonly status: PlatformSkillsAuditStatus;
  readonly reasons: readonly string[];
};

// "https://docs.stripe.com" -> "docs.stripe.com"
const HTTPS_PREFIX_PATTERN = /^https:\/\//;

// "cloudflare/skills/" -> "cloudflare/skills"
const TRAILING_SLASH_PATTERN = /\/$/;

/**
 * Normalize repo keys for lookup (`https://docs.stripe.com` → `docs.stripe.com`).
 *
 * @param repo - repo input.
 * @returns The rendered normalize skills repo key text.
 * @example
 * const result = normalizeSkillsRepoKey(repo);
 */
export const normalizeSkillsRepoKey = (repo: string): string =>
  repo.replace(HTTPS_PREFIX_PATTERN, '').replace(TRAILING_SLASH_PATTERN, '');

const daysBetween = (older: Date, newer: Date): number =>
  (newer.getTime() - older.getTime()) / (1000 * 60 * 60 * 24);

const resolveAuditRepoDate = (
  input: PlatformSkillsAuditInput,
  provider: PlatformSkillsAuditProvider,
): Date | null | undefined => {
  const activityRepo =
    provider.activityRepo === undefined ? provider.skillsRepo : provider.activityRepo;
  const repoKey = normalizeSkillsRepoKey(activityRepo);
  const commitDate = input.repoCommitDates[repoKey];
  if (commitDate !== undefined) {
    return commitDate;
  }
  return input.repoCommitDates[provider.skillsRepo];
};

const evaluateRepoFreshness = (
  input: PlatformSkillsAuditInput,
  provider: PlatformSkillsAuditProvider,
): ProviderFreshnessEvaluation => {
  const commitDate = resolveAuditRepoDate(input, provider);
  if (commitDate === null || commitDate === undefined) {
    return {
      status: 'block',
      reasons: [`Could not resolve last commit for ${provider.skillsRepo}`],
    };
  }

  const repoAge = daysBetween(commitDate, input.now);
  if (repoAge > PLATFORM_SKILLS_REPO_MAX_AGE_DAYS) {
    return {
      status: 'block',
      reasons: [
        `Vendor repo inactive ${Math.floor(repoAge)}d (max ${PLATFORM_SKILLS_REPO_MAX_AGE_DAYS}d)`,
      ],
    };
  }

  return { status: 'pass', reasons: [] };
};

const evaluateNpmFreshness = (
  input: PlatformSkillsAuditInput,
  provider: PlatformSkillsAuditProvider,
): ProviderFreshnessEvaluation => {
  if (provider.npmPackage === undefined) {
    return { status: 'pass', reasons: [] };
  }

  const publishDate = input.npmPublishDates[provider.npmPackage];
  if (publishDate === null || publishDate === undefined) {
    return {
      status: 'warn',
      reasons: [`Could not resolve npm publish date for ${provider.npmPackage}`],
    };
  }

  const npmAge = daysBetween(publishDate, input.now);
  if (npmAge > PLATFORM_SKILLS_NPM_MAX_AGE_DAYS) {
    return {
      status: 'block',
      reasons: [
        `npm ${provider.npmPackage} stale ${Math.floor(npmAge)}d (max ${PLATFORM_SKILLS_NPM_MAX_AGE_DAYS}d)`,
      ],
    };
  }

  return { status: 'pass', reasons: [] };
};

const mergeAuditStatus = (
  left: PlatformSkillsAuditStatus,
  right: PlatformSkillsAuditStatus,
): PlatformSkillsAuditStatus => {
  if (left === 'block' || right === 'block') {
    return 'block';
  }
  if (left === 'warn' || right === 'warn') {
    return 'warn';
  }
  return 'pass';
};

/**
 * Pure freshness evaluation — network I/O lives in scripts/auditPlatformSkills.mjs.
 *
 * @param input - input input.
 * @returns The evaluate platform skills audit entries.
 * @example
 * const result = evaluatePlatformSkillsAudit(input);
 */
export const evaluatePlatformSkillsAudit = (
  input: PlatformSkillsAuditInput,
): PlatformSkillsAuditResult[] => {
  const results: PlatformSkillsAuditResult[] = [];

  for (const provider of PLATFORM_SKILLS_AUDIT_PROVIDERS) {
    const repoEvaluation = evaluateRepoFreshness(input, provider);
    const npmEvaluation = evaluateNpmFreshness(input, provider);
    const reasons = [...repoEvaluation.reasons, ...npmEvaluation.reasons];

    results.push({
      provider: provider.id,
      status: mergeAuditStatus(repoEvaluation.status, npmEvaluation.status),
      reasons: reasons.length === 0 ? ['Freshness checks passed'] : reasons,
    });
  }

  return results;
};

/**
 * True when any audited provider is blocked.
 *
 * @param results - results input.
 * @returns Whether is platform skills audit blocking succeeds.
 * @example
 * const result = isPlatformSkillsAuditBlocking(results);
 */
export const isPlatformSkillsAuditBlocking = (
  results: readonly PlatformSkillsAuditResult[],
): boolean => results.some((r) => r.status === 'block');
