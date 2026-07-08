import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);

const UTILS_PATHS = [
  'templates/web/src/lib/utils.ts',
  'templates/spa/src/lib/utils.ts',
  'templates/extension/src/lib/utils.ts',
  'apps/landing/src/lib/utils.ts',
];

const CONSUMER_PACKAGES = [
  'templates/web',
  'templates/spa',
  'templates/extension',
  'apps/landing',
  'apps/componentLibrary',
];

describe('cnfast migration state', () => {
  it('utils barrels re-export cn from cnfast', () => {
    for (const rel of UTILS_PATHS) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      expect(content).toContain("export { cn } from 'cnfast'");
      expect(content).not.toMatch(/from ['"]clsx['"]/);
      expect(content).not.toMatch(/from ['"]tailwind-merge['"]/);
    }
  });

  it('consumer packages depend on cnfast, not clsx / tailwind-merge', () => {
    for (const rel of CONSUMER_PACKAGES) {
      const pkg = JSON.parse(readFileSync(join(ROOT, rel, 'package.json'), 'utf8'));
      expect(pkg.dependencies?.cnfast).toBeTruthy();
      expect(pkg.dependencies?.clsx).toBeUndefined();
      expect(pkg.dependencies?.['tailwind-merge']).toBeUndefined();
    }
  });
});
