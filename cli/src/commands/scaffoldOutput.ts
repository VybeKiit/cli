import type { TemplateName } from '../lib/scaffold';

/** App surfaces buyers can create via `create app`. */
export type CreateSurface = 'web' | 'mobile' | 'extension';

/**
 * Check whether a template name is a buyer create-app surface.
 *
 * @param value - Candidate surface id.
 * @returns True when the value is web, mobile, or extension.
 * @example
 * isCreateSurface('web');
 */
export const isCreateSurface = (value: string): value is CreateSurface =>
  value === 'web' || value === 'mobile' || value === 'extension';

/**
 * Build the post-create success lines for a scaffolded app.
 *
 * @param surface - Create-app surface that was scaffolded.
 * @param dest - Absolute or user-facing destination path.
 * @returns Ordered human-readable success lines.
 * @example
 * const lines = formatCreateSuccess('web', './web');
 */
export const formatCreateSuccess = (surface: CreateSurface, dest: string): readonly string[] => [
  '',
  `✅ Created kit workspace + ${surface} surface at ${dest}`,
  '   (assets optimize path on; speed-check skill available after doctor in this folder)',
  '',
  'Next (one step):',
  '  Open this folder in your AI coding tool and say: "Set up my app."',
  '',
];

/**
 * Build a plain-language create failure line.
 *
 * @param message - Error message from scaffold or resolution.
 * @returns Ordered human-readable error lines.
 * @example
 * const lines = formatCreateError('Destination is not empty.');
 */
export const formatCreateError = (message: string): readonly string[] => [`❌ ${message}`, ''];

/**
 * Build usage text when create app is missing a surface flag.
 *
 * @returns Ordered usage lines.
 * @example
 * const lines = formatCreateUsage();
 */
export const formatCreateUsage = (): readonly string[] => [
  'Pick one surface for your app:',
  '  vybekiit create app --web [directory]',
  '  vybekiit create app --mobile [directory]',
  '  vybekiit create app --extension [directory]',
  '',
];

/**
 * Map a create surface to the template name used by scaffold.
 *
 * @param surface - Buyer create-app surface.
 * @returns Template name for scaffold and mirror clone.
 * @example
 * const template = surfaceToTemplate('web');
 */
export const surfaceToTemplate = (surface: CreateSurface): TemplateName => surface;
