/**
 * Preview theming helpers. Tokens are shadcn HSL triplets consumed as
 * `hsl(var(--primary))`, so a color picker converts hex -> "H S% L%" and writes it
 * (plus a contrasting foreground) as inline vars on the root.
 */

export type PreviewMode = 'light' | 'dark';

/** Browser storage key for the preview primary color. */
export const PRIMARY_STORAGE_KEY = 'vk-ui-primary';
/** Default preview primary color. */
export const DEFAULT_PRIMARY = '#171717';

/** Curated primary-color swatches for preview theming. */
export const PRESET_PRIMARIES: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'Neutral', hex: '#171717' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
];

const toRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace('#', '');
  // expand shorthand: "#abc" -> "aabbcc"
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
};

/**
 * Convert a hex color to the shadcn HSL triplet format.
 *
 * @param hex - Hex color string to convert.
 * @returns HSL triplet text such as `262 83% 58%`.
 * @example
 * const triplet = hexToHslTriplet('#7c3aed');
 */
export const hexToHslTriplet = (hex: string): string => {
  const { r: r255, g: g255, b: b255 } = toRgb(hex);
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
  return `${h} ${pct(s)}% ${pct(l)}%`;
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
  const { r, g, b } = toRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '0 0% 9%' : '0 0% 98%';
};

/**
 * Apply or clear the inline primary color variables used by previews.
 *
 * @param root - Root element that receives CSS theme variables.
 * @param hex - Hex primary color to apply.
 * @returns Nothing; the helper mutates inline CSS variables on the root.
 * @example
 * applyPrimaryVars(document.documentElement, '#7c3aed');
 */
export const applyPrimaryVars = (root: HTMLElement, hex: string): void => {
  if (!hex || hex.toLowerCase() === DEFAULT_PRIMARY) {
    for (const name of ['--primary', '--primary-foreground', '--ring']) {
      root.style.removeProperty(name);
    }
    return;
  }
  const triplet = hexToHslTriplet(hex);
  root.style.setProperty('--primary', triplet);
  root.style.setProperty('--primary-foreground', foregroundTripletFor(hex));
  root.style.setProperty('--ring', triplet);
};

export interface PreviewSrcOptions {
  readonly thumb?: boolean;
  readonly interactive?: boolean;
}

/**
 * Build the stable embed URL for a component preview.
 *
 * @param namespace - Component source namespace.
 * @param name - Catalog component name.
 * @param options - Optional preview flags for thumbnail or interactive embeds.
 * @returns Relative embed URL for the catalog iframe.
 * @example
 * const src = buildPreviewSrc('magicui', 'button', { thumb: true });
 */
export const buildPreviewSrc = (
  namespace: string,
  name: string,
  options?: PreviewSrcOptions,
): string => {
  const params = new URLSearchParams();
  if (options?.thumb) {
    params.set('thumb', '1');
  }
  if (options?.interactive) {
    params.set('interactive', '1');
  }
  const qs = params.toString();
  return `/embed/${namespace}/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`;
};

/**
 * Build the stable embed URL for a Page recipe preview.
 *
 * @param slug - Page recipe slug.
 * @param options - Optional preview flags for thumbnail embeds.
 * @returns Relative embed URL for the Page recipe iframe.
 * @example
 * const src = buildPageRecipePreviewSrc('auth', { thumb: true });
 */
export const buildPageRecipePreviewSrc = (slug: string, options?: PreviewSrcOptions): string => {
  const params = new URLSearchParams();
  if (options?.thumb) {
    params.set('thumb', '1');
  }
  if (options?.interactive) {
    params.set('interactive', '1');
  }
  const qs = params.toString();
  return `/embed/pages/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`;
};

/**
 * Build a direct embed URL with theme query parameters.
 *
 * @param namespace - Component source namespace.
 * @param name - Catalog component name.
 * @param mode - Preview color mode to apply.
 * @param primary - Primary theme color to apply.
 * @param options - Optional preview flags for thumbnail or interactive embeds.
 * @returns Relative embed URL with query parameters for direct links.
 * @example
 * const src = buildPreviewSrcWithTheme('magicui', 'button', 'light', '#7c3aed');
 * @deprecated Pass theme via postPreviewTheme; this remains for direct embed and e2e links.
 */
export const buildPreviewSrcWithTheme = (
  namespace: string,
  name: string,
  mode: PreviewMode,
  primary: string = DEFAULT_PRIMARY,
  options?: PreviewSrcOptions,
): string => {
  const params = new URLSearchParams({ theme: mode });
  if (primary && primary.toLowerCase() !== DEFAULT_PRIMARY) {
    params.set('primary', primary);
  }
  if (options?.thumb) {
    params.set('thumb', '1');
  }
  if (options?.interactive) {
    params.set('interactive', '1');
  }
  return `/embed/${namespace}/${encodeURIComponent(name)}?${params.toString()}`;
};
