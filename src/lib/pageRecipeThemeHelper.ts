/** Minimal theme helpers inlined when a recipe pulls gallery `@library/lib/theme`. */
export const THEME_HELPER_SOURCE = `/**
 * Local HSL helpers for page-recipe demo palettes (installed with the recipe).
 */

/**
 * Expand a hex color to RGB channels.
 *
 * @param hex - Hex color such as \`#7c3aed\` or \`#abc\`.
 * @returns RGB channels 0–255.
 * @example
 * const rgb = hexToRgbChannels('#7c3aed');
 */
const hexToRgbChannels = (hex: string): { readonly r: number; readonly g: number; readonly b: number } => {
  // #7c3aed → 7c3aed (strip optional leading # only).
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  // #abc → aabbcc; otherwise take the first 6 hex digits.
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  return {
    // byte slices of 7c3aed → r=7c, g=3a, b=ed
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
};

/**
 * Convert a hex color to the shadcn HSL triplet format.
 *
 * @param hex - Hex color string to convert.
 * @returns HSL triplet text such as \`262 83% 58%\`.
 * @example
 * const triplet = hexToHslTriplet('#7c3aed');
 */
export const hexToHslTriplet = (hex: string): string => {
  const { r: r255, g: g255, b: b255 } = hexToRgbChannels(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) {
      h += 360;
    }
  }
  const pct = (value: number) => Math.round(value * 1000) / 10;
  return \`\${h} \${pct(s)}% \${pct(l)}%\`;
};

/**
 * Pick a readable foreground triplet for a primary color.
 *
 * @param hex - Hex color string to inspect.
 * @returns A black or white HSL triplet for text over the primary color.
 * @example
 * const foreground = foregroundTripletFor('#7c3aed');
 */
export const foregroundTripletFor = (hex: string): string => {
  const { r, g, b } = hexToRgbChannels(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '0 0% 9%' : '0 0% 98%';
};
`;
