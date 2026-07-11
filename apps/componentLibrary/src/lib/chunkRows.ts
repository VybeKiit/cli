/**
 * Split a flat list into fixed-width rows for virtualized grids.
 *
 * @param items - Items to chunk.
 * @param columnCount - Columns per row (clamped to at least 1).
 * @returns Row arrays covering every item in order.
 * @example
 * chunkRows([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 */
export const chunkRows = <T>(items: readonly T[], columnCount: number): T[][] => {
  const width = columnCount < 1 ? 1 : columnCount;
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += width) {
    rows.push(items.slice(index, index + width));
  }
  return rows;
};
