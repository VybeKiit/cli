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

  it.each(['deploy', 'db'])('%s exposes only its root contract', (packageName) => {
    expect(readExportPaths(packageName)).toEqual(['.']);
  });

  it.each(['auth', 'deploy', 'db'])('%s has no wildcard export', (packageName) => {
    expect(readExportPaths(packageName).some((exportPath) => exportPath.includes('*'))).toBe(false);
  });
});
