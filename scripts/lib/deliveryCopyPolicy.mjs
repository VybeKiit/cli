/**
 * Maintainer kit-mirror copy policy (shared with CLI deliveryCopyPolicy kit profile).
 * Keep skip basenames in sync with `cli/src/lib/deliveryCopyPolicy.ts` kit profile.
 */

const ALWAYS_SKIP = new Set([
  'node_modules',
  '.next',
  'dist',
  '.turbo',
  'coverage',
  'test-results',
  '.expo',
  '.git',
]);

/**
 * @param {string} src - Absolute path being considered for copy.
 * @returns {boolean} True when the path should be copied into the kit stage tree.
 */
export const shouldCopyKitPath = (src) => {
  const base = src.split(/[/\\]/).pop() ?? '';
  if (ALWAYS_SKIP.has(base) || base.endsWith('.tsbuildinfo')) {
    return false;
  }
  return true;
};
