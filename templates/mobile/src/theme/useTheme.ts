import {
  type ColorName,
  type ThemeName,
  fontSizes,
  fontWeights,
  radius,
  spacing,
  colors as tokenColors,
} from '@vybekiit/tokens';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { toRnHsl } from './hsl';

/** Active palette: every {@link ColorName} as an RN-ready `hsl(...)` color string. */
export type ThemeColors = Record<ColorName, string>;

/**
 * The resolved theme a mobile component styles against.
 *
 * Mirrors the web side's relationship to the tokens: web reads the same palette as
 * CSS variables, mobile reads it here pre-converted to RN color strings. `radius`,
 * `spacing`, `fontSizes`, and `fontWeights` pass through unchanged (RN consumes the
 * raw numbers/strings directly), so this object is the single styling source every
 * primitive imports. No component touches `@vybekiit/tokens` directly.
 */
export type Theme = Readonly<{
  /** Active light/dark color set, keyed by semantic role. */
  readonly colors: ThemeColors;
  /** Which palette is active, following the OS setting. */
  readonly scheme: ThemeName;
  /** Corner radius in px, matching the shared `radius.px` token. */
  readonly radius: number;
  /** Shared 4px spacing scale (xs…xxl). */
  readonly spacing: typeof spacing;
  /** Shared font-size scale in px. */
  readonly fontSizes: typeof fontSizes;
  /** Shared numeric font-weight strings. */
  readonly fontWeights: typeof fontWeights;
}>;

/**
 * Convert one channel-only palette into RN `hsl(...)` color strings.
 *
 * @param scheme - Token palette name to convert.
 * @returns React Native-safe semantic color map.
 * @example
 * const colors = toRnPalette('light');
 */
const toRnPalette = (scheme: ThemeName): ThemeColors => {
  const palette = tokenColors[scheme];
  const rnColors = {} as Record<ColorName, string>;
  for (const name of Object.keys(palette) as ColorName[]) {
    rnColors[name] = toRnHsl(palette[name]);
  }
  return rnColors;
};

/**
 * The mobile styling hook every primitive and screen calls.
 *
 * Reads the OS color scheme via `useColorScheme()` (defaulting to light when the
 * platform reports `null`) and returns the active palette already converted to RN
 * color strings, plus the shared radius/spacing/type scales. The palette is
 * memoized per scheme so a re-render doesn't re-walk the color map; it only
 * recomputes when the user flips light/dark.
 *
 * @returns the active {@link Theme}.
 * @example
 * const { colors } = useTheme();
 */
export const useTheme = (): Theme => {
  const systemScheme = useColorScheme();
  const scheme: ThemeName = systemScheme === 'dark' ? 'dark' : 'light';

  const colors = useMemo(() => toRnPalette(scheme), [scheme]);

  return {
    colors,
    scheme,
    radius: radius.px,
    spacing,
    fontSizes,
    fontWeights,
  };
};
