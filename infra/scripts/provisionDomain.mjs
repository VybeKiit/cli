#!/usr/bin/env node
/**
 * Provision a domain on Cloudflare (+ optional Namecheap NS automation).
 *
 * Reads only the monorepo root `.env`.
 *
 * Usage:
 *   DOMAIN=vybekiit.com node infra/scripts/provisionDomain.mjs
 *   DOMAIN=vybekiit.com node infra/scripts/provisionDomain.mjs --skip-namecheap
 *   DOMAIN=vybekiit.com node infra/scripts/provisionDomain.mjs --skip-email
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv, cloudflareConfigSchema, namecheapConfigSchema } from '@vybekiit/core';
import { loadEnvFile, mergeEnvFile } from '@vybekiit/core/node';
import { getOrCreateZone, setCustomNameservers } from '@vybekiit/deploy';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const domain = process.env.DOMAIN?.trim().toLowerCase();
const args = new Set(process.argv.slice(2));
const skipNamecheap = args.has('--skip-namecheap');
const skipEmail = args.has('--skip-email');

if (!domain) {
  console.error('Set DOMAIN=yourdomain.com');
  process.exit(1);
}

const fileEnv = loadEnvFile(ROOT);
const env = mergeEnvFile(process.env, fileEnv);
for (const [key, value] of Object.entries(fileEnv)) {
  if (value !== undefined) process.env[key] = value;
}

function wrangler(args) {
  const r = spawnSync('npx', ['wrangler', ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  console.log(`\n=== Provision ${domain} ===\n`);

  const cf = parseEnv(cloudflareConfigSchema, env);
  const zone = await getOrCreateZone(cf, domain);
  console.log(`Zone: ${zone.zoneId} (${zone.status})`);
  console.log('Nameservers (set at your registrar if automation is skipped):');
  for (const ns of zone.nameservers) console.log(`  • ${ns}`);

  if (!skipNamecheap && zone.nameservers.length >= 2) {
    const hasNamecheap = ['NAMECHEAP_API_USER', 'NAMECHEAP_API_KEY', 'NAMECHEAP_CLIENT_IP'].some(
      (key) => Boolean(env[key]),
    );
    if (hasNamecheap) {
      try {
        const nc = parseEnv(namecheapConfigSchema, env);
        if (nc.NAMECHEAP_API_USER && nc.NAMECHEAP_API_KEY && nc.NAMECHEAP_CLIENT_IP) {
          await setCustomNameservers(domain, zone.nameservers, nc);
          console.log('Namecheap nameservers updated.');
        }
      } catch (error) {
        console.warn(
          `\n⚠ Namecheap automation failed: ${error instanceof Error ? error.message : error}`,
        );
        console.warn('Set nameservers manually at your registrar.\n');
      }
    }
  }

  if (!skipEmail) {
    console.log('\nEnabling Cloudflare Email Sending…');
    try {
      wrangler(['email', 'sending', 'enable', domain]);
    } catch {
      console.warn(`Run after zone is active: npx wrangler email sending enable ${domain}`);
    }
  }

  console.log('\n--- Next steps ---');
  console.log('1. Wait for zone status "active"');
  console.log(
    '2. cd packages/email/worker && npm i && npx wrangler secret put EMAIL_WORKER_SECRET',
  );
  console.log('3. CLOUDFLARE_ACCOUNT_ID=... npm run deploy');
  console.log('4. Set CLOUDFLARE_EMAIL_ENDPOINT in root .env');
  console.log('5. pnpm email:test-send you@example.com\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
