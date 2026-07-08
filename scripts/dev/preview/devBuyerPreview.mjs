#!/usr/bin/env node
/**
 * Maintainer buyer preview — UI library, web, and extension on fixed ports; optional iOS Simulator.
 *
 *   pnpm dev:preview           → :3002 catalog, :3000 web, :3010 extension HMR
 *   pnpm dev:preview -- --ios  → also opens mobile template in iOS Simulator
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const coreDist = resolve(ROOT, 'packages/core/dist/index.js');
if (!existsSync(coreDist)) {
  console.log('[dev:preview] Building @vybekiit/core (required for web/extension)…');
  const build = spawnSync(PNPM, ['--filter', '@vybekiit/core', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if ((build.status ?? 1) !== 0) {
    process.exit(build.status ?? 1);
  }
}

const WEB_SERVICES = [
  {
    label: 'Component library',
    url: 'http://localhost:3002',
    cwd: 'apps/componentLibrary',
    args: ['dev'],
  },
  {
    label: 'Web template',
    url: 'http://localhost:3000',
    cwd: 'templates/web',
    args: ['dev', '--port', '3000'],
  },
  {
    label: 'Extension dev server',
    url: 'http://localhost:3010',
    cwd: 'templates/extension',
    args: ['dev'],
    env: { PLAYWRIGHT_PORT: '3010', WXT_DEV_SERVER_PORT: '3010' },
  },
];

const argv = process.argv.slice(2);
const withIos = argv.includes('--ios') || argv.includes('--mobile');
const iosOnly = argv.includes('--ios-only') || argv.includes('--mobile-only');

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

function spawnService({ label, url, cwd, args, env = {} }) {
  const absoluteCwd = resolve(ROOT, cwd);
  console.log(`[dev:preview] Starting ${label} → ${url ?? cwd}`);
  const child = spawn(PNPM, args, {
    cwd: absoluteCwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  child.on('error', (error) => {
    console.error(`[dev:preview] ${label} failed: ${error.message}`);
  });
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[dev:preview] ${label} exited with code ${code}`);
    } else if (signal) {
      console.error(`[dev:preview] ${label} stopped (${signal})`);
    }
  });
  children.push(child);
  return child;
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

if (!iosOnly) {
  console.log('\nBuyer preview URLs:');
  for (const service of WEB_SERVICES) {
    console.log(`  • ${service.label}: ${service.url}`);
  }
  console.log('');
  for (const service of WEB_SERVICES) {
    spawnService(service);
  }
}

if (withIos || iosOnly) {
  if (process.platform === 'darwin') {
    console.log('[dev:preview] Opening mobile template in iOS Simulator…');
    spawnService({
      label: 'Mobile (iOS Simulator)',
      url: 'expo://localhost:8081',
      cwd: 'templates/mobile',
      args: ['ios'],
    });
  } else {
    console.warn('[dev:preview] iOS Simulator requires macOS — skipping mobile.');
  }
}

if (!(withIos || iosOnly)) {
  console.log('\nTip: add `-- --ios` to also launch the mobile template in Simulator.\n');
}
