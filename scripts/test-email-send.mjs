#!/usr/bin/env node
/**
 * Send a test email via resolveEmailProvider() — uses root `.env` only.
 *
 * Usage (from monorepo root):
 *   pnpm email:test-send you@example.com
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv, cloudflareEmailConfigSchema } from '@vybekiit/core';
import { loadEnvFile, mergeEnvFile } from '@vybekiit/core/node';
import { resolveEmailProvider } from '@vybekiit/email';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const to = process.argv[2];

if (!to) {
  console.error('Usage: pnpm email:test-send <to-email>');
  process.exit(1);
}

const fileEnv = loadEnvFile(ROOT);
const env = mergeEnvFile(process.env, fileEnv);
for (const [key, value] of Object.entries(fileEnv)) {
  if (value !== undefined) process.env[key] = value;
}

const emailConfig = parseEnv(cloudflareEmailConfigSchema, env);
const from = env.EMAIL_FROM ?? 'hello@vybekiit.com';
const fromName = env.EMAIL_FROM_NAME ?? 'VybeKiit';

const provider = resolveEmailProvider(env);
const result = await provider.send({
  to,
  from: `${fromName} <${from}>`,
  subject: 'VybeKiit — test email',
  text: 'If you received this, Cloudflare Email Sending is working.',
  html: '<p>If you received this, <strong>Cloudflare Email Sending</strong> is working.</p>',
});

if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}

console.log(`Sent to ${to} (id: ${result.value.id}) via ${emailConfig.CLOUDFLARE_EMAIL_ENDPOINT}`);
