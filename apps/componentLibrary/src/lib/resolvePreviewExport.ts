import type { RenderMode } from '@library/data/catalog';
import type { ComponentType } from 'react';

const isComponent = (value: unknown): value is ComponentType => typeof value === 'function';

/**
 * Resolve preview export for the component library.
 *
 * @param mod - Dynamic import module to inspect.
 * @param renderMode - Catalog render mode for the imported module.
 * @returns The value produced by resolvePreviewExport.
 * @example
 * const result = resolvePreviewExport(module, 'demo');
 */
export const resolvePreviewExport = (
  mod: Record<string, unknown>,
  renderMode: RenderMode,
): ComponentType | null => {
  if ((renderMode === 'example' || renderMode === 'demo') && isComponent(mod.default)) {
    return mod.default;
  }

  if (isComponent(mod.default)) {
    return mod.default;
  }

  const named = Object.values(mod).filter(isComponent);
  if (named.length === 1) {
    const [component] = named;
    if (component === undefined) {
      throw new Error('Preview export resolver found a single component but could not read it.');
    }
    return component;
  }

  if (named.length > 1) {
    const preferred = named.find((fn) => fn.name && fn.name !== 'default');
    if (preferred !== undefined) {
      return preferred;
    }
    const [component] = named;
    if (component === undefined) {
      throw new Error('Preview export resolver found components but could not read the first one.');
    }
    return component;
  }

  return null;
};
