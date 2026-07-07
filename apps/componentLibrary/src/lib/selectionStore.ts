import type { CatalogEntry } from '@library/data/catalog';

const STORAGE_KEY = 'vybekiit-ui-library-selection';

type Listener = () => void;

let selectedKeys = new Set<string>();
const listeners = new Set<Listener>();
const keyListeners = new Map<string, Set<Listener>>();

const notifyAll = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const notifyKey = (previewKey: string): void => {
  const bucket = keyListeners.get(previewKey);
  if (!bucket) {
    return;
  }
  for (const listener of bucket) {
    listener();
  }
};

const loadStoredKeys = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
};

const persistKeys = (keys: Set<string>): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (keys.size === 0) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
};

/**
 * Hydrate selection store.
 *
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * hydrateSelectionStore();
 */
export const hydrateSelectionStore = (): void => {
  selectedKeys = loadStoredKeys();
};

/**
 * Get selected keys.
 *
 * @returns The value produced by getSelectedKeys.
 * @example
 * const result = getSelectedKeys();
 */
export const getSelectedKeys = (): ReadonlySet<string> => selectedKeys;

/**
 * Get selection count.
 *
 * @returns The value produced by getSelectionCount.
 * @example
 * const result = getSelectionCount();
 */
export const getSelectionCount = (): number => selectedKeys.size;

/**
 * Is entry selected.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @returns The value produced by isEntrySelected.
 * @example
 * const result = isEntrySelected(entry.previewKey);
 */
export const isEntrySelected = (previewKey: string): boolean => selectedKeys.has(previewKey);

/**
 * Toggle entry selection.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * toggleEntrySelection(entry.previewKey);
 */
export const toggleEntrySelection = (previewKey: string): void => {
  const next = new Set(selectedKeys);
  if (next.has(previewKey)) {
    next.delete(previewKey);
  } else {
    next.add(previewKey);
  }
  selectedKeys = next;
  persistKeys(selectedKeys);
  notifyKey(previewKey);
  notifyAll();
};

/**
 * Clear selection.
 *
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * clearSelection();
 */
export const clearSelection = (): void => {
  if (selectedKeys.size === 0) {
    return;
  }
  const changedKeys = [...selectedKeys];
  selectedKeys = new Set();
  persistKeys(selectedKeys);
  for (const key of changedKeys) {
    notifyKey(key);
  }
  notifyAll();
};

/**
 * Subscribe selection.
 *
 * @param listener - Callback invoked when the subscribed state changes.
 * @returns The value produced by subscribeSelection.
 * @example
 * const result = subscribeSelection(listener);
 */
export const subscribeSelection = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Subscribe selection key.
 *
 * @param previewKey - Stable catalog preview key to read or update.
 * @param listener - Callback invoked when the subscribed state changes.
 * @returns The value produced by subscribeSelectionKey.
 * @example
 * const result = subscribeSelectionKey(entry.previewKey, listener);
 */
export const subscribeSelectionKey = (previewKey: string, listener: Listener): (() => void) => {
  let bucket = keyListeners.get(previewKey);
  if (bucket === undefined) {
    bucket = new Set();
    keyListeners.set(previewKey, bucket);
  }
  bucket.add(listener);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      keyListeners.delete(previewKey);
    }
  };
};

/**
 * Resolve selected entries for the component library.
 *
 * @param byKey - Catalog lookup indexed by preview key.
 * @returns The value produced by resolveSelectedEntries.
 * @example
 * const result = resolveSelectedEntries(catalog.byKey);
 */
export const resolveSelectedEntries = (
  byKey: Readonly<Record<string, CatalogEntry>>,
): CatalogEntry[] =>
  [...selectedKeys]
    .map((key) => byKey[key])
    .filter((entry): entry is CatalogEntry => Boolean(entry));
