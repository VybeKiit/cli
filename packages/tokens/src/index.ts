/**
 * VybeKiit shared design tokens — the single source of truth for the look across
 * web and mobile (ADR-0004).
 *
 * Why one package: the web template styles with shadcn over Tailwind, reading these
 * colors as CSS variables (`hsl(var(--background))`); the mobile template (plain
 * React Native `StyleSheet`, no NativeWind) reads the *same* values directly. A
 * palette, spacing, or radius change ships once here and both platforms stay
 * consistent. Colors are stored as raw HSL channel strings (e.g. `'0 0% 100%'`) so
 * web can wrap them in `hsl(var(--x))` and mobile can wrap them with {@link hsl}.
 */

/** The semantic color roles every theme defines (shadcn neutral base). */
export type ColorName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'cardForeground'
  | 'popover'
  | 'popoverForeground'
  | 'primary'
  | 'primaryForeground'
  | 'secondary'
  | 'secondaryForeground'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'accentForeground'
  | 'destructive'
  | 'destructiveForeground'
  | 'border'
  | 'input'
  | 'ring';

/** Which palette to read — follows the OS preference on both platforms. */
export type ThemeName = 'light' | 'dark';

/**
 * One palette: every {@link ColorName} mapped to its raw HSL channel string
 * (`'<hue> <sat>% <light>%'`). Stored channel-only so the same value serves web
 * (`hsl(var(--x))`) and mobile ({@link hsl}); no platform stores a pre-wrapped color.
 */
export type ColorPalette = Record<ColorName, string>;

/**
 * The light + dark palettes, keyed by {@link ThemeName}.
 *
 * Values are the exact channels the web template currently declares in
 * `globals.css`; this package is the source those vars are meant to derive from.
 */
export interface Colors {
  readonly light: ColorPalette;
  readonly dark: ColorPalette;
}

/** Light + dark color palettes — the canonical neutral shadcn token set. */
export const colors: Colors = {
  light: {
    background: '0 0% 100%',
    foreground: '0 0% 3.9%',
    card: '0 0% 100%',
    cardForeground: '0 0% 3.9%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 3.9%',
    primary: '0 0% 9%',
    primaryForeground: '0 0% 98%',
    secondary: '0 0% 96.1%',
    secondaryForeground: '0 0% 9%',
    muted: '0 0% 96.1%',
    mutedForeground: '0 0% 45.1%',
    accent: '0 0% 96.1%',
    accentForeground: '0 0% 9%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '0 0% 89.8%',
    input: '0 0% 89.8%',
    ring: '0 0% 3.9%',
  },
  dark: {
    background: '0 0% 3.9%',
    foreground: '0 0% 98%',
    card: '0 0% 3.9%',
    cardForeground: '0 0% 98%',
    popover: '0 0% 3.9%',
    popoverForeground: '0 0% 98%',
    primary: '0 0% 98%',
    primaryForeground: '0 0% 9%',
    secondary: '0 0% 14.9%',
    secondaryForeground: '0 0% 98%',
    muted: '0 0% 14.9%',
    mutedForeground: '0 0% 63.9%',
    accent: '0 0% 14.9%',
    accentForeground: '0 0% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: '0 0% 14.9%',
    input: '0 0% 14.9%',
    ring: '0 0% 83.1%',
  },
};

/**
 * Wrap raw HSL channels into a CSS/RN color string, e.g.
 * `hsl('0 0% 100%') === 'hsl(0 0% 100%)'`. React Native accepts this string form,
 * so mobile passes a token straight through; web normally uses `hsl(var(--x))`
 * instead and only needs this for inline non-var colors.
 */
export function hsl(channels: string): string {
  return `hsl(${channels})`;
}

/**
 * Corner radius. `base` is the canonical value; web consumes the `rem` string as the
 * `--radius` var, mobile consumes the matching pixel number for `borderRadius`.
 */
export const radius = {
  /** Web `--radius` value (rem string). */
  base: '0.5rem',
  /** Mobile `borderRadius` value in px, matching `base`. */
  px: 8,
} as const;

/**
 * Spacing scale in pixels — the shared step set for padding/margin/gap. Mobile uses
 * the numbers directly; web maps them through Tailwind. Kept as a small, predictable
 * 4px-based scale (KISS) rather than an open-ended ramp.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Font size scale in pixels, shared across web and mobile type ramps. */
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

/**
 * Font weights as the numeric strings both platforms accept (CSS `font-weight` and
 * RN `fontWeight` share this string form, so one map serves both).
 */
export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Convert a camelCase {@link ColorName} to its kebab-case CSS variable suffix. */
function toCssVarSuffix(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Emit the CSS custom-property map for a theme, e.g. `{ '--background': '0 0% 100%',
 * '--card-foreground': '0 0% 3.9%', ..., '--radius': '0.5rem' }`.
 *
 * This makes the web template's `globals.css` *derivable* from these tokens (the
 * `:root` and dark `:root` blocks are exactly these maps). Values stay channel-only
 * so components keep using `hsl(var(--x))`. (This step ships the capability; it does
 * not rewrite `globals.css`.)
 *
 * @param theme - which palette to emit
 */
export function cssVariables(theme: ThemeName): Record<string, string> {
  const palette = colors[theme];
  const vars: Record<string, string> = {};
  for (const name of Object.keys(palette) as ColorName[]) {
    vars[`--${toCssVarSuffix(name)}`] = palette[name];
  }
  vars['--radius'] = radius.base;
  return vars;
}
