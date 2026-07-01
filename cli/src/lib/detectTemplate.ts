import { inferProjectSurfaceSync } from './inferProjectSurface';
import type { TemplateName } from './scaffold';

/**
 * Infer template from the buyer project layout when no explicit name is passed.
 */
export async function detectTemplateName(cwd: string): Promise<TemplateName | null> {
  return inferProjectSurfaceSync(cwd).template;
}
