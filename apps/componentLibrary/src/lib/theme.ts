/**
 * Preview theming helpers. Tokens are shadcn HSL triplets consumed as
 * `hsl(var(--primary))`, so a color picker converts hex -> "H S% L%" and writes it
 * (plus a contrasting foreground) as inline vars on the root — inline styles beat the
 * stylesheet, so one primary applies to the gallery chrome and every preview iframe.
 */

export type PreviewMode = 'light' | 'dark';

export const PRIMARY_STORAGE_KEY = 'vk-ui-primary';
export const DEFAULT_PRIMARY = '#171717';

export const PRESET_PRIMARIES: ReadonlyArray<{ name: string; hex: string }> = [
  { name: 'Neutral', hex: '#171717' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
];

function toRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  // expand shorthand: "#abc" -> "aabbcc"
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/** Convert "#7c3aed" to a shadcn HSL triplet, e.g. "262 83% 58%". */
export function hexToHslTriplet(hex: string): string {
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
  const pct = (n: number) => Math.round(n * 1000) / 10;
  return `${h} ${pct(s)}% ${pct(l)}%`;
}

/** Pick a black-or-white foreground triplet by perceptual luminance of the primary. */
export function foregroundTripletFor(hex: string): string {
  const { r, g, b } = toRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '0 0% 9%' : '0 0% 98%';
}

/**
 * Apply the primary color as inline vars, or clear them when it's the default neutral
 * so the class-based light/dark tokens flip normally.
 */
export function applyPrimaryVars(root: HTMLElement, hex: string): void {
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
}

export interface PreviewSrcOptions {
  readonly thumb?: boolean;
  readonly interactive?: boolean;
}

/** Stable embed URL — theme/primary are pushed via postMessage after load. */
export function buildPreviewSrc(
  namespace: string,
  name: string,
  options?: PreviewSrcOptions,
): string {
  const params = new URLSearchParams();
  if (options?.thumb) {
    params.set('thumb', '1');
  }
  if (options?.interactive) {
    params.set('interactive', '1');
  }
  const qs = params.toString();
  return `/embed/${namespace}/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`;
}

/** @deprecated Pass theme via postPreviewTheme — kept for direct embed / e2e links. */
export function buildPreviewSrcWithTheme(
  namespace: string,
  name: string,
  mode: PreviewMode,
  primary: string = DEFAULT_PRIMARY,
  options?: PreviewSrcOptions,
): string {
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
}
