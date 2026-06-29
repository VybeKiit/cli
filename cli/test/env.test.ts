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
});

describe('loadEnvFile', () => {
  it('returns empty when no .env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vybekiit-env-'));
    expect(loadEnvFile(dir)).toEqual({});
  });
});
