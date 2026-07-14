import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');

const readExportPaths = (packageName) => {
  const manifestPath = join(repoRoot, 'packages', packageName, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return Object.keys(manifest.exports);
};

describe('private package entrypoints', () => {
  it('exposes only the auth contracts used outside the package', () => {
    expect(readExportPaths('auth')).toEqual([
      '.',
      './client',
      './http',
      './http/express',
      './http/next',
    ]);
  });

  it('exposes the deploy entrypoints used by its runtime self-imports', () => {
    expect(readExportPaths('deploy')).toEqual([
      '.',
      './deployEffect',
      './liveWork/githubPagesProvision',
      './providers/aws',
      './providers/cloudflare',
      './providers/githubPages',
      './providers/railway',
      './providers/vercel',
      './registrar/godaddy',
      './registrar/namecheap',
      './resolve',
      './types',
    ]);
  });

  it('exposes only the db root contract', () => {
    expect(readExportPaths('db')).toEqual(['.']);
  });

  it.each(['auth', 'deploy', 'db'])('%s has no wildcard export', (packageName) => {
    expect(readExportPaths(packageName).some((exportPath) => exportPath.includes('*'))).toBe(false);
  });
});
