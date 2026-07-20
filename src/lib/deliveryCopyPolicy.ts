/**
 * Delivery copy-policy SSOT — one place for skip rules across create-app, drop, and kit stage.
 *
 * Profiles share basename denylists; scaffold additionally skips `scripts/dev` and keeps
 * buyer repos free of monorepo mirror `.git` history.
 */

/** Path profile for which skip rules apply. */
export type DeliveryCopyProfile = 'scaffold' | 'drop' | 'kit';

const PATH_SEPARATOR_PATTERN = /[/\\]/;

/** Basenames never copied into buyer trees or kit mirrors. */
const ALWAYS_SKIP_BASENAMES = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'coverage',
  'test-results',
  '.expo',
]);

/**
 * Whether `dist/` is skipped for this profile.
 *
 * Scaffold (create-app) and kit mirrors keep package `dist/` so `@vybekiit/*` exports
 * resolve on first `pnpm install && pnpm dev` without a monorepo rebuild. Drop overlays
 * stay lean and never clobber a buyer's rebuild with stale artifacts.
 *
 * @param profile - Delivery profile.
 * @returns True when `dist` basenames must be skipped.
 */
const skipsDist = (profile: DeliveryCopyProfile): boolean => profile === 'drop';

/**
 * Split a path into segments on `/` or `\`.
 *
 * @param src - Absolute or relative path.
 * @returns Path segments.
 * @example
 * pathSegments('a/b\\c'); // ['a','b','c']
 */
const pathSegments = (src: string): readonly string[] => src.split(PATH_SEPARATOR_PATTERN);

/**
 * Whether a basename should be skipped for the profile.
 *
 * @param base - Final path segment.
 * @param profile - Delivery profile.
 * @returns True when this basename is denylisted.
 */
const isSkippedBasename = (base: string, profile: DeliveryCopyProfile): boolean => {
  if (ALWAYS_SKIP_BASENAMES.has(base)) {
    return true;
  }
  if (base === 'dist' && skipsDist(profile)) {
    return true;
  }
  if (profile === 'kit') {
    return base === '.git' || base.endsWith('.tsbuildinfo');
  }
  if (profile === 'scaffold') {
    // `.git` never scaffolds into a buyer repo; `dev` is scripts/dev scratch (also path rule).
    return base === '.git' || base === 'dev';
  }
  // drop: always-skip + dist + .git
  return base === '.git';
};

/**
 * Check whether a source path should be copied for the given delivery profile.
 *
 * @param src - Source path currently being considered by `fs.cp` or a walker.
 * @param profile - scaffold (create-app), drop (overlay), or kit (mirror stage).
 * @returns True when the path is safe to copy.
 */
export const shouldCopyDeliveryPath = (
  src: string,
  profile: DeliveryCopyProfile = 'scaffold',
): boolean => {
  const parts = pathSegments(src);
  if (parts.some((part) => isSkippedBasename(part, profile))) {
    return false;
  }

  // Scaffold: skip maintainer-only scripts/dev/ scratch (ADR-0029).
  if (profile === 'scaffold') {
    return !parts.some((part, index) => part === 'scripts' && parts[index + 1] === 'dev');
  }

  return true;
};

/**
 * Scaffold filter used by create-app and template copy.
 *
 * @param src - Source path.
 * @returns True when safe to copy into a buyer project.
 */
export const shouldCopyScaffoldPath = (src: string): boolean =>
  shouldCopyDeliveryPath(src, 'scaffold');

/**
 * Drop filter used when overlaying a template onto an existing project.
 *
 * @param src - Source path.
 * @returns True when safe to copy.
 */
export const shouldCopyDropPath = (src: string): boolean => shouldCopyDeliveryPath(src, 'drop');

/**
 * Kit mirror stage filter (maintainer push to VybeKiit/kit).
 *
 * @param src - Source path.
 * @returns True when safe to stage.
 */
export const shouldCopyKitPath = (src: string): boolean => shouldCopyDeliveryPath(src, 'kit');
