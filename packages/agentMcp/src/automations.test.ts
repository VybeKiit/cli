import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  automateBinNotFoundError,
  buildAutomationArgv,
  lookupAutomation,
  resolveAutomateBin,
  resolveAutomateBinDetailed,
  runAutomation,
  searchAutomations,
} from './automations.js';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('searchAutomations', () => {
  it('finds lemon squeezy setup', () => {
    const page = searchAutomations('lemon squeezy setup', { limit: 10 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(
      page.items.some(
        (item) => item.command === 'setup' && (item.domain === 'ls' || item.domain.includes('ls')),
      ),
    ).toBe(true);
  });

  it('finds google oauth via redirect_uri_mismatch symptom', () => {
    const page = searchAutomations('redirect_uri_mismatch', { limit: 10 });
    expect(page.items.some((item) => item.domain === 'google' && item.command === 'oauth')).toBe(
      true,
    );
  });

  it('google oauth catalog blurb mentions redirect_uri_mismatch', () => {
    const entry = lookupAutomation('google', 'oauth');
    expect(entry).toBeDefined();
    if (entry === undefined) {
      throw new Error('expected google oauth catalog entry');
    }
    expect(entry.description.toLowerCase()).toContain('redirect_uri_mismatch');
  });

  it('paginates the catalog', () => {
    const first = searchAutomations('', { limit: 5 });
    expect(first.items).toHaveLength(5);
    expect(first.hasMore).toBe(true);
  });
});

describe('lookupAutomation', () => {
  it('resolves short ls alias', () => {
    expect(lookupAutomation('ls', 'standby')?.command).toBe('standby');
  });
});

describe('buildAutomationArgv', () => {
  it('always includes --json and --yes by default', () => {
    expect(buildAutomationArgv('ls', 'setup', ['--name=Kit'])).toEqual([
      '--json',
      '--yes',
      'ls',
      'setup',
      '--name=Kit',
    ]);
  });
});

describe('resolveAutomateBin', () => {
  it('returns a non-empty path or command name', () => {
    expect(resolveAutomateBin().length).toBeGreaterThan(0);
  });

  it('prefers VYBEKIIT_AUTOMATE_BIN when set', () => {
    process.env.VYBEKIIT_AUTOMATE_BIN = '/tmp/fake-vybekiit-automate.cjs';
    const detailed = resolveAutomateBinDetailed('/tmp');
    expect(detailed.bin).toBe('/tmp/fake-vybekiit-automate.cjs');
    expect(detailed.source).toBe('env');
    expect(detailed.available).toBe(false);
  });
});

describe('automateBinNotFoundError', () => {
  it('returns structured fix steps', () => {
    const err = automateBinNotFoundError({
      bin: 'vybekiit-automate',
      source: 'path',
      available: false,
      fixSteps: ['Set VYBEKIIT_AUTOMATE_BIN', 'Build package'],
    });
    expect(err.error).toBe('automate_bin_not_found');
    expect(err.fix.length).toBeGreaterThan(0);
    expect(err.bin).toBe('vybekiit-automate');
  });
});

describe('runAutomation dry-run', () => {
  it('plans without spawning browser work', async () => {
    const result = await runAutomation('ls', 'standby', { dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.argv).toContain('--json');
    expect(result.argv).toContain('ls');
    expect(result.argv).toContain('standby');
  });

  it('rejects unknown verbs', async () => {
    const result = await runAutomation('nope', 'missing', { dryRun: true });
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain('Unknown automation');
  });

  it('plans google oauth from a non-monorepo cwd with an available bin', async () => {
    const throwaway = mkdtempSync(join(tmpdir(), 'vybekiit-automate-cwd-'));
    const result = await runAutomation('google', 'oauth', {
      dryRun: true,
      cwd: throwaway,
      args: [
        '--project=replybase-app',
        '--app-name=Replybase',
        '--support-email=test@example.com',
        '--app-url=https://replybase.dev',
        '--redirect=https://replybase.dev/api/auth/callback/google',
        '--redirect=http://localhost:3000/api/auth/callback/google',
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.cwd).toBe(throwaway);
    expect(result.argv).toContain('google');
    expect(result.argv).toContain('oauth');
    expect(result.argv.some((a) => a.includes('localhost:3000'))).toBe(true);
    expect(result.bin.length).toBeGreaterThan(0);
    const planned = JSON.parse(result.stdout) as {
      planned: boolean;
      bin: string;
      binSource: string;
      binAvailable: boolean;
      warning?: unknown;
    };
    expect(planned.planned).toBe(true);
    expect(planned.bin).toBe(result.bin);
    // From-anywhere: agent-mcp resolves package/monorepo bin even when cwd is outside the kit.
    expect(planned.binAvailable).toBe(true);
    expect(planned.warning).toBeUndefined();
    expect(planned.binSource === 'package' || planned.binSource === 'monorepo').toBe(true);
  });

  it('returns structured automate_bin_not_found when env bin is missing and not dry-run', async () => {
    process.env.VYBEKIIT_AUTOMATE_BIN = join(tmpdir(), 'definitely-missing-vybekiit-automate.cjs');
    const result = await runAutomation('google', 'oauth', {
      dryRun: false,
      args: [
        '--project=p',
        '--app-name=A',
        '--support-email=e@e.com',
        '--app-url=https://x.com',
        '--redirect=https://x.com/cb',
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.stderr).toContain('automate_bin_not_found');
    const parsed = JSON.parse(result.stderr) as { error: string; fix: string[] };
    expect(parsed.error).toBe('automate_bin_not_found');
    expect(parsed.fix.length).toBeGreaterThan(0);
  });
});
