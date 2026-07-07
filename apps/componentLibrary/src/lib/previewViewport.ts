import type { PreviewMode } from '@library/lib/theme';

export type ViewportPreset = 'desktop' | 'tablet' | 'mobile' | 'custom';

export type PreviewSize = 's' | 'm' | 'l' | 'xl' | 'xxl';

/** CSS widths for fixed viewport preview presets. */
export const VIEWPORT_PRESET_WIDTHS: Record<Exclude<ViewportPreset, 'custom'>, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

/** Scale factors for preview zoom controls. */
export const SIZE_SCALES: Record<PreviewSize, number> = {
  s: 0.5,
  m: 0.75,
  l: 1,
  xl: 1.25,
  xxl: 1.5,
};

/** Short labels for the preview zoom control. */
export const PREVIEW_SIZE_LABELS: Record<PreviewSize, string> = {
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  xxl: 'XXL',
};

const VIEWPORT_STORAGE_KEY = 'vk-preview-viewport';
const SIZE_STORAGE_KEY = 'vk-preview-size';
const CUSTOM_WIDTH_STORAGE_KEY = 'vk-preview-custom-width';

/**
 * Load viewport preset from browser storage or catalog data.
 *
 * @returns The loaded value produced by loadViewportPreset.
 * @example
 * const result = loadViewportPreset();
 */
export const loadViewportPreset = (): ViewportPreset => {
  if (typeof window === 'undefined') {
    return 'desktop';
  }
  const stored = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
  if (stored === 'tablet' || stored === 'mobile' || stored === 'custom' || stored === 'desktop') {
    return stored;
  }
  return 'desktop';
};

/**
 * Save viewport preset for the component library.
 *
 * @param preset - Viewport preset to persist.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * saveViewportPreset('desktop');
 */
export const saveViewportPreset = (preset: ViewportPreset): void => {
  sessionStorage.setItem(VIEWPORT_STORAGE_KEY, preset);
};

/**
 * Load custom viewport width from browser storage or catalog data.
 *
 * @returns The loaded value produced by loadCustomViewportWidth.
 * @example
 * const result = loadCustomViewportWidth();
 */
export const loadCustomViewportWidth = (): number => {
  if (typeof window === 'undefined') {
    return 960;
  }
  const stored = Number(sessionStorage.getItem(CUSTOM_WIDTH_STORAGE_KEY));
  return Number.isFinite(stored) && stored >= 320 ? stored : 960;
};

/**
 * Save custom viewport width for the component library.
 *
 * @param width - Custom viewport width in pixels.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * saveCustomViewportWidth(960);
 */
export const saveCustomViewportWidth = (width: number): void => {
  sessionStorage.setItem(CUSTOM_WIDTH_STORAGE_KEY, String(width));
};

/**
 * Load preview size from browser storage or catalog data.
 *
 * @returns The loaded value produced by loadPreviewSize.
 * @example
 * const result = loadPreviewSize();
 */
export const loadPreviewSize = (): PreviewSize => {
  if (typeof window === 'undefined') {
    return 'l';
  }
  const stored = sessionStorage.getItem(SIZE_STORAGE_KEY);
  if (stored === 's' || stored === 'm' || stored === 'l' || stored === 'xl' || stored === 'xxl') {
    return stored;
  }
  return 'l';
};

/**
 * Save preview size for the component library.
 *
 * @param size - Preview scale preset to persist.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * savePreviewSize('l');
 */
export const savePreviewSize = (size: PreviewSize): void => {
  sessionStorage.setItem(SIZE_STORAGE_KEY, size);
};

/**
 * Resolve viewport width for the component library.
 *
 * @param preset - Viewport preset to persist.
 * @param customWidth - Input passed to this customWidth parameter.
 * @returns The value produced by resolveViewportWidth.
 * @example
 * const result = resolveViewportWidth('desktop', customWidth);
 */
export const resolveViewportWidth = (preset: ViewportPreset, customWidth: number): string => {
  if (preset === 'custom') {
    return `${customWidth}px`;
  }
  return VIEWPORT_PRESET_WIDTHS[preset];
};
