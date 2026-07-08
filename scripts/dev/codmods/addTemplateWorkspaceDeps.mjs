#!/usr/bin/env node
/** Add workspace:* deps for new domain packages to template package.json files. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const DOMAINS = [
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
];

const TEMPLATE_ROOTS = [
  'templates/web',
  'templates/spa',
  'templates/mobile',
  'templates/extension',
  'templates/backend',
  'apps/landing',
];

for (const rel of TEMPLATE_ROOTS) {
  const pkgPath = join(ROOT, rel, 'package.json');
  if (!readFileSync(pkgPath, 'utf8').includes('"dependencies"')) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.dependencies ??= {};
  for (const d of DOMAINS) {
    const key = `@vybekiit/${d}`;
    if (!pkg.dependencies[key]) pkg.dependencies[key] = 'workspace:*';
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}
console.log('Template package.json deps updated.');
