#!/usr/bin/env node
/** Finish package scaffolding after migrateDomainPackages.mjs */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);

function writePackageJson(name, description, extraDeps = {}, extraExports = {}) {
  const pkgDir = join(ROOT, 'packages', name);
  if (!existsSync(join(pkgDir, 'src'))) return;
  const entries = ['src/index.ts'];
  if (name === 'assets' && existsSync(join(pkgDir, 'src/next.ts'))) entries.push('src/next.ts');
  const pkg = {
    name: `@vybekiit/${name}`,
    version: '0.3.0',
    description,
    license: 'MIT',
    type: 'module',
    main: './dist/index.cjs',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.js', require: './dist/index.cjs' },
      ...extraExports,
    },
    files: ['dist'],
    sideEffects: false,
    scripts: { build: 'tsup', typecheck: 'tsc --noEmit', test: 'vitest run' },
    dependencies: { '@vybekiit/core': 'workspace:*', effect: '3.21.4', ...extraDeps },
    devDependencies: { tsup: '^8.3.5', typescript: '^5.7.2', vitest: '^3.2.6' },
    publishConfig: { access: 'public' },
  };
  if (name === 'assets' && existsSync(join(pkgDir, 'src/next.ts'))) {
    pkg.exports['./next'] = {
      types: './dist/next.d.ts',
      import: './dist/next.js',
      require: './dist/next.cjs',
    };
  }
  writeFileSync(join(pkgDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(
    join(pkgDir, 'tsconfig.json'),
    `${JSON.stringify({ extends: '../../tsconfig.base.json', compilerOptions: { noEmit: true }, include: ['src', 'test', 'tsup.config.ts'] }, null, 2)}\n`,
  );
  const entryLines = entries.map((e) => `    '${e}',`).join('\n');
  writeFileSync(
    join(pkgDir, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup';\n\nexport default defineConfig({\n  entry: [\n${entryLines}\n  ],\n  format: ['esm', 'cjs'],\n  dts: true,\n  clean: true,\n  sourcemap: true,\n  treeshake: true,\n});\n`,
  );
}

const descriptions = {
  ai: 'Headless AI provider adapters for VybeKiit.',
  analytics: 'Headless analytics provider adapters for VybeKiit.',
  assets: 'Asset delivery and optimization for VybeKiit.',
  cms: 'Headless CMS adapters for VybeKiit.',
  compliance: 'Compliance provider adapters for VybeKiit.',
  email: 'Headless email provider adapters for VybeKiit.',
  i18n: 'Locale rules and RTL helpers for VybeKiit templates.',
  jobs: 'Background jobs provider adapters for VybeKiit.',
  kv: 'Key-value storage provider adapters for VybeKiit.',
  notifications: 'Headless notifications for VybeKiit.',
  realtime: 'Realtime provider adapters for VybeKiit.',
  search: 'Search provider adapters for VybeKiit.',
  seo: 'SEO metadata helpers for VybeKiit.',
  tenancy: 'Multi-tenancy provider adapters for VybeKiit.',
  tokens: 'Design tokens and CSS variables for VybeKiit.',
};

for (const [name, desc] of Object.entries(descriptions)) {
  const extra =
    name === 'notifications'
      ? { '@vybekiit/email': 'workspace:*' }
      : name === 'tenancy'
        ? { '@vybekiit/auth': 'workspace:*', '@vybekiit/db': 'workspace:*' }
        : name === 'assets'
          ? { svgo: '^3.3.2', sharp: '^0.33.5' }
          : {};
  writePackageJson(name, desc, extra);
}

const paths = {};
for (const pkg of readdirSync(join(ROOT, 'packages'))) {
  if (!existsSync(join(ROOT, 'packages', pkg, 'src'))) continue;
  paths[`@vybekiit/${pkg}`] = [`packages/${pkg}/src/index.ts`];
  paths[`@vybekiit/${pkg}/*`] = [`packages/${pkg}/src/*`];
}
const basePath = join(ROOT, 'tsconfig.base.json');
const base = JSON.parse(readFileSync(basePath, 'utf8'));
base.compilerOptions.paths = paths;
writeFileSync(basePath, `${JSON.stringify(base, null, 2)}\n`);
console.log('Scaffold done for', Object.keys(descriptions).join(', '));
