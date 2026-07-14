import { CREATE_SURFACES, type CreateSurface } from './createSurfaceRegistry';

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
  ...CREATE_SURFACES.map((surface) => `  vybekiit create app --${surface.id} [directory]`),
  '',
];
