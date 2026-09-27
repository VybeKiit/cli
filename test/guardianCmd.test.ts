import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { parseGuardianTargets, runGuardianCheck } from '../src/commands/guardianCmd';

const temporaryProject = async (): Promise<string> =>
  await mkdtemp(join(tmpdir(), 'vybekiit-guardian-'));

describe('parseGuardianTargets', () => {
  it('accepts repeated named targets and keeps URL equals signs intact', () => {
    expect(
      parseGuardianTargets([
        '--target=store=https://app.example.com/health?ready=true',
        '--target',
        'api=https://api.example.com/health',
      ]),
    ).toEqual([
      { name: 'store', url: 'https://app.example.com/health?ready=true' },
      { name: 'api', url: 'https://api.example.com/health' },
    ]);
  });
});

describe('runGuardianCheck', () => {
  it('returns a useful argument error without prompting', async () => {
    const guardianCommand = await runGuardianCheck([]);

    expect(guardianCommand.exitCode).toBe(1);
    expect(guardianCommand.printedText).toContain('--target');
  });

  it('stores a new incident fingerprint and deduplicates the next check', async () => {
    const projectDirectory = await temporaryProject();
    const guardianFetch = vi.fn(async () => Promise.reject(new Error('offline')));
    const commandArguments = [
      '--target=store=https://app.example.com/health?token=never-print',
      '--json',
    ];

    try {
      const firstCommand = await runGuardianCheck(commandArguments, {
        projectDirectory,
        fetch: guardianFetch,
        now: () => 1000,
        checkedAt: () => '2026-08-31T03:00:00.000Z',
      });
      const repeatedCommand = await runGuardianCheck(commandArguments, {
        projectDirectory,
        fetch: guardianFetch,
        now: () => 1000,
        checkedAt: () => '2026-08-31T03:01:00.000Z',
      });
      const firstPublicReport = JSON.parse(firstCommand.printedText);
      const repeatedPublicReport = JSON.parse(repeatedCommand.printedText);
      const incidentFile = JSON.parse(
        await readFile(join(projectDirectory, '.vybekiit', 'guardian-incidents.json'), 'utf8'),
      );

      expect(firstCommand.exitCode).toBe(2);
      expect(firstPublicReport.incidents[0].duplicate).toBe(false);
      expect(firstPublicReport.incidents[0].repairBrief).not.toContain('never-print');
      expect(repeatedCommand.exitCode).toBe(2);
      expect(repeatedPublicReport.incidents[0].duplicate).toBe(true);
      expect(incidentFile).toHaveLength(1);
    } finally {
      await rm(projectDirectory, { recursive: true, force: true });
    }
  });
});
