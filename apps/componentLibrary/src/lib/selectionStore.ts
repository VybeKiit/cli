import type { CatalogEntry } from '@library/data/catalog';

const STORAGE_KEY = 'vybekiit-ui-library-selection';

type Listener = () => void;

let selectedKeys = new Set<string>();
const listeners = new Set<Listener>();
const keyListeners = new Map<string, Set<Listener>>();

function notifyAll(): void {
  for (const listener of listeners) {
    listener();
  }
}

function notifyKey(previewKey: string): void {
  const bucket = keyListeners.get(previewKey);
  if (!bucket) {
    return;
  }
  for (const listener of bucket) {
    listener();
  }
}

function loadStoredKeys(): Set<string> {
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
}

function persistKeys(keys: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (keys.size === 0) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
}

export function hydrateSelectionStore(): void {
  selectedKeys = loadStoredKeys();
}

export function getSelectedKeys(): ReadonlySet<string> {
  return selectedKeys;
}

export function getSelectionCount(): number {
  return selectedKeys.size;
}

export function isEntrySelected(previewKey: string): boolean {
  return selectedKeys.has(previewKey);
}

export function toggleEntrySelection(previewKey: string): void {
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
}

export function clearSelection(): void {
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
}

export function subscribeSelection(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeSelectionKey(previewKey: string, listener: Listener): () => void {
  const bucket = keyListeners.get(previewKey) ?? new Set();
  bucket.add(listener);
  keyListeners.set(previewKey, bucket);
  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      keyListeners.delete(previewKey);
    }
  };
}

export function resolveSelectedEntries(
  byKey: Readonly<Record<string, CatalogEntry>>,
): CatalogEntry[] {
  return [...selectedKeys]
    .map((key) => byKey[key])
    .filter((entry): entry is CatalogEntry => Boolean(entry));
}
