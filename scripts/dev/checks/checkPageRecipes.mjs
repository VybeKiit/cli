#!/usr/bin/env node
/**
 * Verify the generated Page recipe index and feature coverage.
 */

import { fileURLToPath } from 'node:url';
import { buildPageRecipeIndex } from '../sync/buildPageRecipeIndex.mjs';

/**
 * CLI entrypoint for the Page recipe verification gate.
 *
 * @returns {Promise<void>} Resolves when Page recipe coverage is current.
 * @example
 * await main();
 */
export const main = async () => {
  await buildPageRecipeIndex({ check: true });
  console.log('Page recipe coverage is current.');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
