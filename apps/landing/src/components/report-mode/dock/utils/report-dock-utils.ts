import type { ReportDockAnchor } from '@vybekiit/report-mode';

/**
 * Chevron points outward when collapsed, inward when expanded (relative to screen edge).
 *
 * @param anchor - Input value.
 * @param customX - Input value.
 * @param expanded - Input value.
 * @returns The computed result.
 * @example
 * const result = getBrandChevronDirection(anchor, customX, expanded);
 */

export const getBrandChevronDirection = (
  anchor: ReportDockAnchor,
  customX: number | undefined,
  expanded: boolean,
): 'left' | 'right' => {
  const dockOnRight =
    anchor === 'bottom-right' ||
    anchor === 'top-right' ||
    (anchor === 'custom' &&
      customX !== undefined &&
      typeof window !== 'undefined' &&
      customX > window.innerWidth / 2);

  if (expanded) {
    return dockOnRight ? 'right' : 'left';
  }

  return dockOnRight ? 'left' : 'right';
};
