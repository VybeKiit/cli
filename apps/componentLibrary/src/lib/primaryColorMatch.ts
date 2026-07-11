/**
 * Case-insensitive hex equality for primary color swatches.
 *
 * @param primary - Currently selected primary hex.
 * @param hex - Candidate preset hex.
 * @returns Whether the colors match.
 * @example
 * isPrimarySelected('#7C3AED', '#7c3aed'); // true
 */
export const isPrimarySelected = (primary: string, hex: string): boolean =>
  primary.toLowerCase() === hex.toLowerCase();
