import type { PreviewMode } from '@library/lib/theme';

export type ViewportPreset = 'desktop' | 'tablet' | 'mobile' | 'custom';

export type PreviewSize = 's' | 'm' | 'l' | 'xl' | 'xxl';

export const VIEWPORT_PRESET_WIDTHS: Record<Exclude<ViewportPreset, 'custom'>, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export const SIZE_SCALES: Record<PreviewSize, number> = {
  s: 0.5,
  m: 0.75,
  l: 1,
  xl: 1.25,
  xxl: 1.5,
};

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

export function loadViewportPreset(): ViewportPreset {
  if (typeof window === 'undefined') {
    return 'desktop';
  }
  const stored = sessionStorage.getItem(VIEWPORT_STORAGE_KEY);
  if (stored === 'tablet' || stored === 'mobile' || stored === 'custom' || stored === 'desktop') {
    return stored;
  }
  return 'desktop';
}

export function saveViewportPreset(preset: ViewportPreset): void {
  sessionStorage.setItem(VIEWPORT_STORAGE_KEY, preset);
}

export function loadCustomViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 960;
  }
  const stored = Number(sessionStorage.getItem(CUSTOM_WIDTH_STORAGE_KEY));
  return Number.isFinite(stored) && stored >= 320 ? stored : 960;
}

export function saveCustomViewportWidth(width: number): void {
  sessionStorage.setItem(CUSTOM_WIDTH_STORAGE_KEY, String(width));
}

export function loadPreviewSize(): PreviewSize {
  if (typeof window === 'undefined') {
    return 'l';
  }
  const stored = sessionStorage.getItem(SIZE_STORAGE_KEY);
  if (stored === 's' || stored === 'm' || stored === 'l' || stored === 'xl' || stored === 'xxl') {
    return stored;
  }
  return 'l';
}

export function savePreviewSize(size: PreviewSize): void {
  sessionStorage.setItem(SIZE_STORAGE_KEY, size);
}

export function resolveViewportWidth(preset: ViewportPreset, customWidth: number): string {
  if (preset === 'custom') {
    return `${customWidth}px`;
  }
  return VIEWPORT_PRESET_WIDTHS[preset];
}
