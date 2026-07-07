import type { ComponentType } from 'react';

/**
 * Check whether a registry value can be rendered as a React component.
 *
 * @param value - Unknown registry value.
 * @returns True when the value is callable as a component.
 * @example
 * const canRender = isReactComponent(candidate);
 */
const isReactComponent = (value: unknown): value is ComponentType => typeof value === 'function';

export { isReactComponent };
