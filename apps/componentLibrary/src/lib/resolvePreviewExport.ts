import type { RenderMode } from '@library/data/catalog';
import type { ComponentType } from 'react';

function isComponent(value: unknown): value is ComponentType {
  return typeof value === 'function';
}

/**
 * Pick the React component to render from a dynamic import module.
 */
export function resolvePreviewExport(
  mod: Record<string, unknown>,
  renderMode: RenderMode,
): ComponentType | null {
  if ((renderMode === 'example' || renderMode === 'demo') && isComponent(mod.default)) {
    return mod.default;
  }

  if (isComponent(mod.default)) {
    return mod.default;
  }

  const named = Object.values(mod).filter(isComponent);
  if (named.length === 1) {
    return named[0] ?? null;
  }

  if (named.length > 1) {
    const preferred = named.find((fn) => fn.name && fn.name !== 'default');
    return preferred ?? named[0] ?? null;
  }

  return null;
}
