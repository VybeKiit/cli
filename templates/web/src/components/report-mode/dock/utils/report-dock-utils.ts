import type { ReportDockAnchor } from '@vybekiit/report-mode';

/**
 * Resolve the brand-chip chevron direction for the dock position.
 *
 * @param anchor - Current dock anchor.
 * @param customX - Custom dock x-coordinate when the anchor is `custom`.
 * @param expanded - Whether the dock controls are expanded.
 * @returns `left` or `right` so the chevron points toward the intended action.
 * @example
 * const direction = getBrandChevronDirection('bottom-right', undefined, false);
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
      typeof globalThis.window !== 'undefined' &&
      customX > globalThis.innerWidth / 2);

  if (expanded) {
    return dockOnRight ? 'right' : 'left';
  }

  return dockOnRight ? 'left' : 'right';
};
