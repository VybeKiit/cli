/**
 * Calculate the perimeter of a rounded rectangle for SVG stroke-dash animation.
 *
 * @param width - Rectangle width in SVG units.
 * @param height - Rectangle height in SVG units.
 * @param radius - Corner radius in SVG units.
 * @returns The perimeter length used by progress stroke math.
 * @example
 * const perimeter = getRoundedRectPerimeter(92, 36, 10);
 */
const getRoundedRectPerimeter = (width: number, height: number, radius: number): number => {
  const r = Math.min(radius, width / 2, height / 2);
  return 2 * (width - 2 * r) + 2 * (height - 2 * r) + 2 * Math.PI * r;
};

interface RoundedRectStrokePathOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

/**
 * Build a clockwise rounded-rectangle stroke path for hold progress.
 *
 * @param options - Rectangle origin, size, and radius in SVG units.
 * @returns SVG path data that starts at the top center.
 * @example
 * const path = buildRoundedRectStrokePath({ x: 4, y: 4, width: 92, height: 36, radius: 10 });
 */
const buildRoundedRectStrokePath = ({
  x,
  y,
  width,
  height,
  radius,
}: RoundedRectStrokePathOptions): string => {
  const r = Math.min(radius, width / 2, height / 2);
  const x2 = x + width;
  const y2 = y + height;
  const midX = x + width / 2;

  return [
    `M ${midX} ${y}`,
    `H ${x2 - r}`,
    `A ${r} ${r} 0 0 1 ${x2} ${y + r}`,
    `V ${y2 - r}`,
    `A ${r} ${r} 0 0 1 ${x2 - r} ${y2}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y2 - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    `H ${midX}`,
  ].join(' ');
};

const HOLD_RECT_COMPACT = { width: 92, height: 92, radius: 14, pad: 4 } as const;
const HOLD_RECT_WIDE = { width: 92, height: 36, radius: 10, pad: 4 } as const;

export { HOLD_RECT_COMPACT, HOLD_RECT_WIDE, buildRoundedRectStrokePath, getRoundedRectPerimeter };
