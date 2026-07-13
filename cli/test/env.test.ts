import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadEnvFile, writeEnvKeys } from '../src/doctor/env';

describe('writeEnvKeys', () => {
  it('upserts keys into .env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vybekiit-env-'));
    writeEnvKeys(dir, { STORAGE_PROVIDER: 'r2', R2_BUCKET: 'test-bucket' });
    const content = readFileSync(join(dir, '.env'), 'utf8');
    expect(content).toContain('STORAGE_PROVIDER=r2');
    expect(content).toContain('R2_BUCKET=test-bucket');

    writeEnvKeys(dir, { R2_BUCKET: 'updated-bucket' });
    const updated = readFileSync(join(dir, '.env'), 'utf8');
    expect(updated).toContain('R2_BUCKET=updated-bucket');
    expect(updated.split('R2_BUCKET=').length - 1).toBe(1);
  });

  it('securely upserts a github-pages host pin, no hand-edit needed (ADR-0040)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vybekiit-env-'));
    // The exact key map buildHostPinKeys emits for a github-pages provision — the
    // same map `live-work host` feeds through this secure appender, so a buyer never
    // hand-edits .env. The written HOSTING_PROVIDER round-trips as a schema value.
    writeEnvKeys(dir, { HOSTING_PROVIDER: 'github-pages', GITHUB_PAGES_REPO: 'octocat/app' });
    expect(loadEnvFile(dir)).toMatchObject({
      HOSTING_PROVIDER: 'github-pages',
      GITHUB_PAGES_REPO: 'octocat/app',
    });

    // Re-pinning upserts in place — the buyer's HOSTING_PROVIDER never doubles.
    writeEnvKeys(dir, { HOSTING_PROVIDER: 'github-pages' });
    const content = readFileSync(join(dir, '.env'), 'utf8');
    expect(content.split('HOSTING_PROVIDER=').length - 1).toBe(1);
  });
});

describe('loadEnvFile', () => {
  it('returns empty when no .env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vybekiit-env-'));
    expect(loadEnvFile(dir)).toEqual({});
  });
});
