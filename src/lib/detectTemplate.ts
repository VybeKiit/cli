import { inferProjectSurfaceSync } from './inferProjectSurface';
import type { TemplateName } from './scaffold';

/**
 * Infer template from the buyer project layout when no explicit name is passed.
 *
 * @param cwd - Buyer project directory to inspect.
 * @returns Detected template name, or null when detection cannot identify one.
 * @example
 * const template = await detectTemplateName(process.cwd());
 */
export const detectTemplateName = async (cwd: string): Promise<TemplateName | null> =>
  inferProjectSurfaceSync(cwd).template;
