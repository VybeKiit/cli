import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseArgs, redact } from './mirror-repos.mjs';

/**
 * Guard tests for the delivery-mirror sync (ADR-0005). The script self-guards its
 * `main()` behind an `import.meta`/argv check, so importing it here never triggers a real
 * `git subtree split` or push. These tests lock the three things a 5-repo registry is most
 * likely to silently break: an arg typo passing validation, a token leaking into a log, and
 * a mapped source prefix that no longer exists on disk.
 */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The mirrors whose source prefix must exist today. */
const PRESENT_MIRRORS = [
  { repo: 'web', path: 'templates/web' },
  { repo: 'spa', path: 'templates/spa' },
  { repo: 'mobile', path: 'templates/mobile' },
  { repo: 'extension', path: 'templates/extension' },
  { repo: 'cli', path: 'cli' },
  { repo: 'infra', path: 'infra' },
];

describe('parseArgs', () => {
  it('defaults to all five mirrors when no names are given', () => {
    const { names, dryRun } = parseArgs([]);
    expect(names).toEqual(['web', 'spa', 'mobile', 'extension', 'cli', 'infra']);
    expect(dryRun).toBe(false);
  });

  it('keeps only the requested names and reads --dry-run', () => {
    const { names, dryRun } = parseArgs(['cli', '--dry-run']);
    expect(names).toEqual(['cli']);
    expect(dryRun).toBe(true);
  });

  it('rejects an unknown mirror name (catches a typo before it force-pushes nothing)', () => {
    expect(() => parseArgs(['webb'])).toThrow(/Unknown mirror/);
  });
});

describe('redact', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('replaces the token everywhere it appears in a would-be log line', () => {
    vi.stubEnv('GH_MIRROR_TOKEN', 'ghp_secret123');
    const line = 'fatal: https://x-access-token:ghp_secret123@github.com/VybeKiit/cli.git';
    const cleaned = redact(line);
    expect(cleaned).not.toContain('ghp_secret123');
    expect(cleaned).toContain('***');
  });

  it('passes text through unchanged when no token is configured', () => {
    vi.stubEnv('GH_MIRROR_TOKEN', '');
    expect(redact('no token here')).toBe('no token here');
  });
});

describe('mirror source prefixes', () => {
  it.each(
    PRESENT_MIRRORS.map((m) => [m.repo, m.path]),
  )('has on-disk source for the %s mirror at %s', async (_repo, path) => {
    await expect(access(join(REPO_ROOT, path))).resolves.toBeUndefined();
  });
});
