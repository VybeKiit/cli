import { describe, expect, it } from 'vitest';
import {
  buildAutomationArgv,
  lookupAutomation,
  resolveAutomateBin,
  runAutomation,
  searchAutomations,
} from './automations.js';

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
});
