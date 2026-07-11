/**
 * Package-root public surface for core automation types.
 * Kept separate from `./types` so domain `AttachedSession` shapes do not collide
 * when the package barrel does pure `export *`.
 */
export type { BaseVerbContext } from './types';
export { DEFAULT_CDP_ENDPOINT, PROFILE_PATHS } from './types';
