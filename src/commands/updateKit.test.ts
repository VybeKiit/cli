import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { writeKitWorkspaceManifest } from '../lib/kitUpdateManifest';
import { runUpdateKit } from './updateKit';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '..', '..', 'test', 'fixtures', 'safeUpdate');
const WORK_ROOT = join(HERE, '..', '..', 'test', '.work', 'safeUpdate');

const prepareBuyer = async (caseName: string): Promise<string> => {
  const buyerRoot = join(WORK_ROOT, caseName);
  await rm(buyerRoot, { recursive: true, force: true });
  await mkdir(dirname(buyerRoot), { recursive: true });
  await cp(join(FIXTURE_ROOT, 'buyer'), buyerRoot, { recursive: true });
  await writeKitWorkspaceManifest({
    projectRoot: buyerRoot,
    kitVersion: '1.0.0',
    surface: 'web',
  });
  await writeFile(join(buyerRoot, 'templates', 'web', 'src', 'page.txt'), 'buyer owned\n');
  return buyerRoot;
};

afterEach(async () => {
  await rm(WORK_ROOT, { recursive: true, force: true });
});

describe('runUpdateKit verification transaction', () => {
  it('tests a green update in isolation and preserves the buyer-owned app', async () => {
    const buyerRoot = await prepareBuyer('green');
    const receipt = await runUpdateKit([
      '--apply',
      '--yes',
      `--cwd=${buyerRoot}`,
      `--source=${join(FIXTURE_ROOT, 'target-green')}`,
    ]);

    expect(receipt.exitCode).toBe(0);
    expect(receipt.outcome.status).toBe('applied');
    await expect(
      readFile(join(buyerRoot, 'packages', 'core', 'src', 'release.txt'), 'utf8'),
    ).resolves.toBe('green\n');
    await expect(
      readFile(join(buyerRoot, 'templates', 'web', 'src', 'page.txt'), 'utf8'),
    ).resolves.toBe('buyer owned\n');
  }, 15_000);

  it('refuses a red update and leaves the real workspace on its working version', async () => {
    const buyerRoot = await prepareBuyer('red');
    const receipt = await runUpdateKit([
      '--apply',
      '--yes',
      `--cwd=${buyerRoot}`,
      `--source=${join(FIXTURE_ROOT, 'target-red')}`,
    ]);

    expect(receipt.exitCode).toBe(1);
    expect(receipt.outcome.status).toBe('verification-failed');
    await expect(
      readFile(join(buyerRoot, 'packages', 'core', 'src', 'release.txt'), 'utf8'),
    ).resolves.toBe('old\n');
    expect(receipt.lines.join('\n')).toContain('Your working app was not changed');
  }, 15_000);
});

describe('runUpdateKit ownership and cancellation', () => {
  it('refuses an owned-file conflict before verification or apply', async () => {
    const buyerRoot = await prepareBuyer('owned-conflict');
    const receipt = await runUpdateKit([
      '--apply',
      '--yes',
      `--cwd=${buyerRoot}`,
      `--source=${join(FIXTURE_ROOT, 'target-conflict')}`,
    ]);

    expect(receipt.exitCode).toBe(1);
    expect(receipt.outcome.status).toBe('owned-file-conflict');
    expect(receipt.outcome.plan.ownedFileConflicts).toEqual(['templates/web/src/page.txt']);
    await expect(
      readFile(join(buyerRoot, 'templates', 'web', 'src', 'page.txt'), 'utf8'),
    ).resolves.toBe('buyer owned\n');
  });

  it('handles interactive cancellation through the same update operation', async () => {
    const buyerRoot = await prepareBuyer('cancelled');
    const receipt = await runUpdateKit(
      ['--apply', `--cwd=${buyerRoot}`, `--source=${join(FIXTURE_ROOT, 'target-green')}`],
      {
        interactive: true,
        confirmApply: async () => false,
      },
    );

    expect(receipt.exitCode).toBe(0);
    expect(receipt.outcome.status).toBe('cancelled');
    await expect(
      readFile(join(buyerRoot, 'packages', 'core', 'src', 'release.txt'), 'utf8'),
    ).resolves.toBe('old\n');
  });
});

describe('runUpdateKit non-interactive plan', () => {
  it('returns a machine-readable plan without applying in non-interactive mode', async () => {
    const buyerRoot = await prepareBuyer('plan');
    const receipt = await runUpdateKit([
      '--json',
      `--cwd=${buyerRoot}`,
      `--source=${join(FIXTURE_ROOT, 'target-green')}`,
    ]);

    expect(receipt.exitCode).toBe(0);
    expect(receipt.outcome.status).toBe('planned');
    expect(receipt.outcome.plan.currentVersion).toBe('1.0.0');
    expect(receipt.outcome.plan.targetVersion).toBe('1.1.0');
    expect(receipt.outcome.plan.changedMaintainedAreas).toContain('packages/core');
    expect(receipt.lines).toEqual([JSON.stringify(receipt.outcome)]);
  });
});
