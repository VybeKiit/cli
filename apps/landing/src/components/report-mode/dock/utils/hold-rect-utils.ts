/** Perimeter of a rounded rectangle for SVG stroke-dash animation. */
export function getRoundedRectPerimeter(width: number, height: number, radius: number): number {
  const r = Math.min(radius, width / 2, height / 2);
  return 2 * (width - 2 * r) + 2 * (height - 2 * r) + 2 * Math.PI * r;
}

/** Clockwise stroke path for hold progress (starts top-center). */
export function buildRoundedRectStrokePath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
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
}

export const HOLD_RECT_COMPACT = { width: 92, height: 92, radius: 14, pad: 4 } as const;
export const HOLD_RECT_WIDE = { width: 92, height: 36, radius: 10, pad: 4 } as const;
