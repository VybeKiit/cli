/** Ordered semantic color roles every theme defines. */
export const colorNames = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'border',
  'input',
  'ring',
] as const;

/** The semantic color roles every theme defines. */
export type ColorName = (typeof colorNames)[number];

/** Supported palette names for shared color tokens. */
export type ThemeName = 'light' | 'dark';

/** Raw HSL channel strings keyed by semantic color name. */
export type ColorPalette = Readonly<Record<ColorName, string>>;

/** Light and dark palettes keyed by theme name. */
export type Colors = {
  readonly light: ColorPalette;
  readonly dark: ColorPalette;
};

/** Light and dark color palettes for shared web and mobile UI. */
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
 * Wrap raw HSL channels into a CSS-compatible color string.
 *
 * @param channels - Raw HSL channel string from a shared color token.
 * @returns A CSS-compatible `hsl(...)` color string.
 * @example
 * const background = hsl(colors.light.background);
 */
export const hsl = (channels: string): string => `hsl(${channels})`;

/** Corner radius tokens shared by web and mobile UI. */
export const radius = {
  /** Web `--radius` value (rem string). */
  base: '0.5rem',
  /** Mobile `borderRadius` value in px, matching `base`. */
  px: 8,
} as const;

/** Spacing scale in pixels. */
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

/** Font weights accepted by CSS and React Native. */
export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Convert a camelCase {@link ColorName} to its kebab-case CSS variable suffix. */
const toCssVarSuffix = (name: string): string =>
  // camelCase token key -> kebab-case CSS variable suffix: "cardForeground" -> "card-foreground"
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Emit the CSS custom-property map for a theme.
 *
 * @param theme - Palette name to emit as CSS custom properties.
 * @returns A map of CSS custom-property names to raw HSL channel values.
 * @example
 * const vars = cssVariables('light');
 */
export const cssVariables = (theme: ThemeName): Record<string, string> => {
  const palette = colors[theme];
  const vars: Record<string, string> = {};
  for (const name of colorNames) {
    vars[`--${toCssVarSuffix(name)}`] = palette[name];
  }
  vars['--radius'] = radius.base;
  return vars;
};
