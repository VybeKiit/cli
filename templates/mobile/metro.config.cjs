'use strict';
// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/**
 * Metro config for this app inside the VybeKiit pnpm monorepo.
 *
 * Expo's default config auto-detects a monorepo on SDK 52+, but pnpm stores deps
 * in a non-hoisted, symlinked layout, so we make the two things Metro needs
 * explicit (per Expo's "Work with monorepos" guide):
 *
 *   1. watchFolders — also watch the repo root so edits to the symlinked
 *      `@vybekiit/*` workspace packages trigger a rebuild.
 *   2. nodeModulesPaths — resolve from this app's node_modules first, then the
 *      root, so hoisted/peer deps (react, react-native) and the workspace
 *      packages all resolve through pnpm's symlinks.
 *
 * `unstable_enableSymlinks` lets Metro follow pnpm's symlinked packages.
 */
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
