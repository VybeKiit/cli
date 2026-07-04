#!/usr/bin/env node
/**
 * Build and run the dev-verify Docker image: native toolchain plan checks + served UI library.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const ROOT = repoRootFrom(import.meta.url);
const IMAGE = 'vybekiit-dev-verify';
const DOCKERFILE = join(ROOT, 'docker', 'dev-verify', 'Dockerfile');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Building ${IMAGE}…`);
run('docker', ['build', '-f', DOCKERFILE, '-t', IMAGE, ROOT]);

console.log(`Running ${IMAGE}…`);
run('docker', ['run', '--rm', '-p', '3002:3002', IMAGE]);
