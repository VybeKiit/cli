#!/usr/bin/env node
import process from 'node:process';
/**
 * Deploy apps/landing to Cloudflare via @vybekiit/deploy.
 * Maintainer helper — requires CLOUDFLARE_* env and wrangler login.
 */
import { resolveHosting } from '@vybekiit/deploy';

const hosting = resolveHosting();
const result = await hosting.deploy({
  projectName: 'vybekiit-landing',
  buildDir: 'apps/landing/.next',
});

if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}
console.log('Deploy complete:', result.value.url);
