/** Browser storage key for the catalog infinite-scroll toggle. */
export const CATALOG_SCROLL_MODE_STORAGE_KEY = 'vybekiit-ui-library-infinite-scroll';

/** Number of cards shown per paginated catalog page. */
export const CATALOG_PAGE_SIZE = 16;

/**
 * Load infinite scroll enabled from browser storage or catalog data.
 *
 * @returns The loaded value produced by loadInfiniteScrollEnabled.
 * @example
 * const result = loadInfiniteScrollEnabled();
 */
export const loadInfiniteScrollEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_SCROLL_MODE_STORAGE_KEY);
    if (raw === null) {
      return false;
    }
    return raw === 'true';
  } catch {
    return false;
  }
};

/**
 * Save infinite scroll enabled for the component library.
 *
 * @param enabled - Whether infinite scroll should be enabled.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * saveInfiniteScrollEnabled(true);
 */
export const saveInfiniteScrollEnabled = (enabled: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CATALOG_SCROLL_MODE_STORAGE_KEY, String(enabled));
};
