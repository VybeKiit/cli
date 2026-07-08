/** A grouped mobile viewport preset for Page recipe previews. */
export interface MobileViewportPreset {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly group: 'iPhone' | 'Android';
  readonly sourceLabel: string;
  readonly sourceUrl: string;
}

/** The custom mobile viewport option id. */
export const CUSTOM_MOBILE_VIEWPORT_PRESET_ID = 'custom';

/** The default mobile viewport option id. */
export const DEFAULT_MOBILE_VIEWPORT_PRESET_ID = 'iphone-12-pro-max';

/** The default mobile viewport shown in recipe captions. */
export const DEFAULT_MOBILE_VIEWPORT = {
  width: 428,
  height: 926,
} as const;

const APPLE_HIG_LAYOUT_URL = 'https://developer.apple.com/design/human-interface-guidelines/layout';
const APPLE_IPHONE_17_PRO_MAX_URL = 'https://support.apple.com/en-us/125091';
const APPLE_IPHONE_17_PRO_URL = 'https://support.apple.com/en-us/125090';
const APPLE_IPHONE_16_PRO_MAX_URL = 'https://support.apple.com/en-us/121032';
const APPLE_IPHONE_16_URL = 'https://support.apple.com/en-us/121029';
const APPLE_IPHONE_12_PRO_MAX_URL = 'https://support.apple.com/en-us/111874';
const ANDROID_WINDOW_SIZE_CLASSES_URL =
  'https://developer.android.com/develop/ui/views/layout/use-window-size-classes';
// biome-ignore lint/security/noSecrets: Official Google Help URL, not a secret.
const GOOGLE_PIXEL_SPECS_URL = 'https://support.google.com/pixelphone/answer/7158570?hl=en';

/** Source-backed mobile viewport presets for Page recipe previews. */
export const MOBILE_VIEWPORT_PRESETS = [
  {
    id: 'iphone-17-pro-max',
    label: 'iPhone 17 Pro Max / 16 Pro Max',
    width: 440,
    height: 956,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points, Apple Support display specs',
    sourceUrl: APPLE_IPHONE_17_PRO_MAX_URL,
  },
  {
    id: 'iphone-17-pro',
    label: 'iPhone 17 / 17 Pro',
    width: 402,
    height: 874,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points, Apple Support display specs',
    sourceUrl: APPLE_IPHONE_17_PRO_URL,
  },
  {
    id: 'iphone-16-plus',
    label: 'iPhone 16 Plus / 15 Plus / 15 Pro Max / 14 Pro Max',
    width: 430,
    height: 932,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points, Apple Support display specs',
    sourceUrl: APPLE_IPHONE_16_PRO_MAX_URL,
  },
  {
    id: 'iphone-16',
    label: 'iPhone 16 / 15 / 15 Pro / 14 Pro',
    width: 393,
    height: 852,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points, Apple Support display specs',
    sourceUrl: APPLE_IPHONE_16_URL,
  },
  {
    id: 'iphone-12-pro-max',
    label: 'iPhone 12 Pro Max / 13 Pro Max / 14 Plus',
    width: 428,
    height: 926,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points, Apple Support display specs',
    sourceUrl: APPLE_IPHONE_12_PRO_MAX_URL,
  },
  {
    id: 'iphone-12',
    label: 'iPhone 12 / 12 Pro / 13 / 13 Pro / 14',
    width: 390,
    height: 844,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points',
    sourceUrl: APPLE_HIG_LAYOUT_URL,
  },
  {
    id: 'iphone-mini',
    label: 'iPhone 12 mini / 13 mini',
    width: 375,
    height: 812,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points',
    sourceUrl: APPLE_HIG_LAYOUT_URL,
  },
  {
    id: 'iphone-se',
    label: 'iPhone SE / 8 / 7 / 6',
    width: 375,
    height: 667,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points',
    sourceUrl: APPLE_HIG_LAYOUT_URL,
  },
  {
    id: 'iphone-small-legacy',
    label: 'iPhone SE 1st gen / 5s',
    width: 320,
    height: 568,
    group: 'iPhone',
    sourceLabel: 'Apple HIG points',
    sourceUrl: APPLE_HIG_LAYOUT_URL,
  },
  {
    id: 'android-compact-min',
    label: 'Android compact phone min',
    width: 360,
    height: 640,
    group: 'Android',
    sourceLabel: 'Android compact width class',
    sourceUrl: ANDROID_WINDOW_SIZE_CLASSES_URL,
  },
  {
    id: 'pixel-9',
    label: 'Google Pixel 9 / 9 Pro Fold cover',
    width: 410,
    height: 919,
    group: 'Android',
    sourceLabel: 'Google Pixel 2024 specs converted to dp',
    sourceUrl: GOOGLE_PIXEL_SPECS_URL,
  },
  {
    id: 'pixel-9-fold-inner',
    label: 'Google Pixel 9 Pro Fold inner',
    width: 891,
    height: 923,
    group: 'Android',
    sourceLabel: 'Google Pixel 2024 specs converted to dp',
    sourceUrl: GOOGLE_PIXEL_SPECS_URL,
  },
  {
    id: 'android-medium',
    label: 'Android medium window',
    width: 600,
    height: 900,
    group: 'Android',
    sourceLabel: 'Android medium width class',
    sourceUrl: ANDROID_WINDOW_SIZE_CLASSES_URL,
  },
  {
    id: 'android-expanded',
    label: 'Android expanded tablet or foldable',
    width: 840,
    height: 900,
    group: 'Android',
    sourceLabel: 'Android expanded width class',
    sourceUrl: ANDROID_WINDOW_SIZE_CLASSES_URL,
  },
] as const satisfies readonly MobileViewportPreset[];

/**
 * Resolve a mobile viewport preset by id.
 *
 * @param id - Preset id selected by the viewer.
 * @returns The matching mobile viewport preset, or the default iPhone 12 Pro Max preset.
 * @example
 * const preset = findMobileViewportPreset('iphone-12-pro-max');
 */
export const findMobileViewportPreset = (id: string): MobileViewportPreset =>
  MOBILE_VIEWPORT_PRESETS.find((preset) => preset.id === id) ??
  MOBILE_VIEWPORT_PRESETS.find((preset) => preset.id === DEFAULT_MOBILE_VIEWPORT_PRESET_ID) ??
  MOBILE_VIEWPORT_PRESETS[0];

/**
 * Keep custom mobile viewport dimensions inside useful preview bounds.
 *
 * @param value - User-entered viewport dimension.
 * @returns A clamped viewport dimension in CSS pixels.
 * @example
 * const width = clampMobileViewportDimension(412);
 */
export const clampMobileViewportDimension = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_MOBILE_VIEWPORT.width;
  }
  return Math.min(1200, Math.max(320, Math.round(value)));
};
