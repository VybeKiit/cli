#!/usr/bin/env node
/**
 * Ensure dedicated Chrome is running on a CDP port with the expected profile.
 * Usage: node scripts/ensureChromeCdp.mjs <port> <profileDir>
 */
import { ensureChromeWithCdp } from '../dist/index.js';

const port = Number(process.argv[2]);
const profileDir = process.argv[3];
const forceRelaunch = process.env.FORCE_RELAUNCH === '1';

if (!(port && profileDir)) {
  console.error('Usage: node scripts/ensureChromeCdp.mjs <port> <profileDir>');
  process.exit(1);
}

await ensureChromeWithCdp({ port, profileDir, forceRelaunch });
