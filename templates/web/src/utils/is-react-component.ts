import type { ComponentType } from 'react';

export function isReactComponent(value: unknown): value is ComponentType {
  return typeof value === 'function';
}
