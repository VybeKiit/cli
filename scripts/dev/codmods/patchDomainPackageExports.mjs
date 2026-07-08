#!/usr/bin/env node
/** Add wildcard exports and glob tsup entries for domain packages. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = join(repoRootFrom(import.meta.url), 'packages');
const DOMAIN = new Set([
  'ai',
  'analytics',
  'assets',
  'cms',
  'compliance',
  'email',
  'i18n',
  'jobs',
  'kv',
  'notifications',
  'realtime',
  'search',
  'seo',
  'tenancy',
  'tokens',
]);

for (const name of readdirSync(ROOT)) {
  if (!DOMAIN.has(name)) continue;
  const dir = join(ROOT, name);
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.exports = {
    '.': pkg.exports['.'],
    './*': {
      types: './dist/*.d.ts',
      import: './dist/*.js',
      require: './dist/*.cjs',
    },
  };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(
    join(dir, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/__tests__/**', '!src/**/*.test.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
`,
  );
}
console.log('Updated domain package exports + tsup glob entries.');
