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
  'dist',
  '.turbo',
  'coverage',
  'test-results',
  '.expo',
]);

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
  if (profile === 'kit') {
    return base === '.git' || base.endsWith('.tsbuildinfo');
  }
  if (profile === 'scaffold') {
    // `.git` never scaffolds into a buyer repo; `dev` is scripts/dev scratch (also path rule).
    return base === '.git' || base === 'dev';
  }
  // drop: keep overlay loose — only always-skip + .git (no dist on drop historically)
  return base === '.git';
};

/**
 * Check whether a source path should be copied for the given delivery profile.
 *
 * @param src - Source path currently being considered by `fs.cp` or a walker.
 * @param profile - scaffold (create-app), drop (overlay), or kit (mirror stage).
 * @returns True when the path is safe to copy.
 * @example
 * shouldCopyDeliveryPath('templates/web/src/app/page.tsx', 'scaffold');
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
 * @example
 * shouldCopyScaffoldPath('packages/core/src/index.ts');
 */
export const shouldCopyScaffoldPath = (src: string): boolean =>
  shouldCopyDeliveryPath(src, 'scaffold');

/**
 * Drop filter used when overlaying a template onto an existing project.
 *
 * @param src - Source path.
 * @returns True when safe to copy.
 * @example
 * shouldCopyDropPath('templates/web/app/page.tsx');
 */
export const shouldCopyDropPath = (src: string): boolean => shouldCopyDeliveryPath(src, 'drop');

/**
 * Kit mirror stage filter (maintainer push to VybeKiit/kit).
 *
 * @param src - Source path.
 * @returns True when safe to stage.
 * @example
 * shouldCopyKitPath('/repo/packages/core/dist/index.js'); // false
 */
export const shouldCopyKitPath = (src: string): boolean => shouldCopyDeliveryPath(src, 'kit');
