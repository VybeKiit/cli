export const CATALOG_SCROLL_MODE_STORAGE_KEY = 'vybekiit-ui-library-infinite-scroll';

export const CATALOG_PAGE_SIZE = 16;

export function loadInfiniteScrollEnabled(): boolean {
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
}

export function saveInfiniteScrollEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CATALOG_SCROLL_MODE_STORAGE_KEY, String(enabled));
}
