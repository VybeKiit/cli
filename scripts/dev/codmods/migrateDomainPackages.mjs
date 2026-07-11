#!/usr/bin/env node
/**
 * One-shot migration: templates vybekiit folders to packages plus import codemod.
 * Run from repo root: node scripts/migrateDomainPackages.mjs
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const WEB_VYB = join(ROOT, 'templates/web/src/vybekiit');

const DOMAINS = [
  'ai',
  'analytics',
  'assets',
  'cms',
  'compliance',
  'email',
  'jobs',
  'kv',
  'notifications',
  'realtime',
  'search',
  'seo',
  'tenancy',
  'tokens',
];

const EXTRA_FROM_SPA = ['i18n'];

function sh(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function writePackageJson(name, description, extraDeps = {}, extraExports = {}) {
  const pkgDir = join(ROOT, 'packages', name);
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
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/index.cjs',
      },
      ...extraExports,
    },
    files: ['dist'],
    sideEffects: false,
    scripts: {
      build: 'tsup',
      typecheck: 'tsc --noEmit',
      test: 'vitest run',
    },
    dependencies: {
      '@vybekiit/core': 'workspace:*',
      effect: '3.21.4',
      ...extraDeps,
    },
    devDependencies: {
      tsup: '^8.3.5',
      typescript: '^5.7.2',
      vitest: '^3.2.6',
    },
    publishConfig: { access: 'public' },
  };
  writeFileSync(join(pkgDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
}

function writeTsconfig(name) {
  writeFileSync(
    join(ROOT, 'packages', name, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { noEmit: true },
        include: ['src', 'test', 'tsup.config.ts'],
      },
      null,
      2,
    )}\n`,
  );
}

function writeTsup(name, entries = ['src/index.ts']) {
  const entryLines = entries.map((e) => `    '${e}',`).join('\n');
  writeFileSync(
    join(ROOT, 'packages', name, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
${entryLines}
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
`,
  );
}

function gitMv(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  if (!existsSync(from)) return;
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  sh(`git mv "${from}" "${to}"`);
}

// 1. responseSchemas → core
const responseSchemasSrc = join(WEB_VYB, 'http/responseSchemas.ts');
const responseSchemasDst = join(ROOT, 'packages/core/src/http/responseSchemas.ts');
if (existsSync(responseSchemasSrc)) {
  gitMv(responseSchemasSrc, responseSchemasDst);
  rmSync(join(WEB_VYB, 'http'), { recursive: true, force: true });
}

// 2. Move domains from web
for (const domain of DOMAINS) {
  const from = join(WEB_VYB, domain);
  const to = join(ROOT, 'packages', domain, 'src');
  if (!existsSync(from)) continue;
  mkdirSync(join(ROOT, 'packages', domain), { recursive: true });
  gitMv(from, to);
}

// 3. i18n from spa
const i18nFrom = join(ROOT, 'templates/spa/src/vybekiit/i18n');
const i18nTo = join(ROOT, 'packages/i18n/src');
if (existsSync(i18nFrom)) {
  mkdirSync(join(ROOT, 'packages/i18n'), { recursive: true });
  gitMv(i18nFrom, i18nTo);
}

// 4. Package scaffolding
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
  notifications: 'Headless notifications (push, SMS, email bridge) for VybeKiit.',
  realtime: 'Realtime provider adapters for VybeKiit.',
  search: 'Search provider adapters for VybeKiit.',
  seo: 'SEO metadata helpers for VybeKiit.',
  tenancy: 'Multi-tenancy provider adapters for VybeKiit.',
  tokens: 'Design tokens and CSS variables for VybeKiit.',
};

for (const domain of [...DOMAINS, 'i18n']) {
  if (!existsSync(join(ROOT, 'packages', domain, 'src'))) continue;
  const extraExports =
    domain === 'assets' && existsSync(join(ROOT, 'packages/assets/src/next.ts'))
      ? {
          './next': {
            types: './dist/next.d.ts',
            import: './dist/next.js',
            require: './dist/next.cjs',
          },
        }
      : {};
  const extraDeps =
    domain === 'notifications'
      ? { '@vybekiit/messaging': 'workspace:*' }
      : domain === 'tenancy'
        ? { '@vybekiit/auth': 'workspace:*', '@vybekiit/db': 'workspace:*' }
        : domain === 'assets'
          ? { svgo: '^3.3.2', sharp: '^0.33.5' }
          : {};
  const entries = ['src/index.ts'];
  if (domain === 'assets' && existsSync(join(ROOT, 'packages/assets/src/next.ts'))) {
    entries.push('src/next.ts');
  }
  writePackageJson(domain, descriptions[domain] ?? domain, extraDeps, extraExports);
  writeTsconfig(domain);
  writeTsup(domain, entries);
}

// 5. tsconfig.base paths
const allPackages = readdirSync(join(ROOT, 'packages')).filter((d) =>
  existsSync(join(ROOT, 'packages', d, 'src')),
);
const paths = {};
for (const pkg of allPackages) {
  paths[`@vybekiit/${pkg}`] = [`packages/${pkg}/src/index.ts`];
  paths[`@vybekiit/${pkg}/*`] = [`packages/${pkg}/src/*`];
}
const basePath = join(ROOT, 'tsconfig.base.json');
const base = JSON.parse(readFileSync(basePath, 'utf8'));
base.compilerOptions.paths = paths;
writeFileSync(basePath, `${JSON.stringify(base, null, 2)}\n`);

console.log('Migration scaffold complete. Run codemod next.');
