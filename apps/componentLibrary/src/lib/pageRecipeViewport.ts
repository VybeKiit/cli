/** Logical device viewport size in CSS pixels for Page recipe previews. */
export interface PageRecipeViewport {
  readonly width: number;
  readonly height: number;
}

/** Device tier for Page recipe frames. */
export type PageRecipeDevice = 'desktop' | 'tablet' | 'mobile';

export const TABLET_VIEWPORT: PageRecipeViewport = {
  width: 768,
  height: 1024,
};

export const DESKTOP_VIEWPORT: PageRecipeViewport = {
  width: 1280,
  height: 800,
};

export const DEVICE_LABELS: Readonly<Record<PageRecipeDevice, string>> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

/** Max frame heights per device tier (drives scale-to-fit). */
export const DEVICE_MAX_HEIGHTS: Readonly<Record<PageRecipeDevice, number>> = {
  desktop: 560,
  tablet: 500,
  mobile: 500,
};
