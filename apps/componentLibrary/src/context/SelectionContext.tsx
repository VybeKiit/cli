'use client';

import { useCatalogData } from '@library/context/CatalogDataContext';
import type { CatalogEntry } from '@library/data/catalog';
import {
  clearSelection,
  getSelectionCount,
  hydrateSelectionStore,
  isEntrySelected,
  resolveSelectedEntries,
  subscribeSelection,
  subscribeSelectionKey,
  toggleEntrySelection,
} from '@library/lib/selectionStore';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

interface SelectionActionsValue {
  readonly toggle: (previewKey: string) => void;
  readonly clear: () => void;
}

const SelectionActionsContext = createContext<SelectionActionsValue | null>(null);

export function SelectionProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    hydrateSelectionStore();
  }, []);

  const toggle = useCallback((previewKey: string) => {
    toggleEntrySelection(previewKey);
  }, []);

  const clear = useCallback(() => {
    clearSelection();
  }, []);

  const actions = useMemo(() => ({ toggle, clear }), [toggle, clear]);

  return (
    <SelectionActionsContext.Provider value={actions}>{children}</SelectionActionsContext.Provider>
  );
}

function useSelectionActions(): SelectionActionsValue {
  const ctx = useContext(SelectionActionsContext);
  if (!ctx) {
    throw new Error('useSelectionActions must be used within SelectionProvider');
  }
  return ctx;
}

/** Per-card subscription — only re-renders when this key toggles. */
export function useIsSelected(previewKey: string): boolean {
  return useSyncExternalStore(
    (listener) => subscribeSelectionKey(previewKey, listener),
    () => isEntrySelected(previewKey),
    () => false,
  );
}

export function useSelectionToggle(): (previewKey: string) => void {
  return useSelectionActions().toggle;
}

/** Tray-only hook — re-renders on any selection change. */
export function useSelectionTrayState(): {
  readonly count: number;
  readonly selectedEntries: CatalogEntry[];
  readonly clear: () => void;
} {
  const catalog = useCatalogData();
  const { clear } = useSelectionActions();
  const count = useSyncExternalStore(subscribeSelection, getSelectionCount, () => 0);

  const selectedEntries = useMemo(
    () => resolveSelectedEntries(catalog.byKey),
    [catalog.byKey, count],
  );

  return { count, selectedEntries, clear };
}

/** @deprecated Prefer `useIsSelected` + `useSelectionToggle` on cards. */
export function useSelection() {
  const { toggle, clear } = useSelectionActions();
  const tray = useSelectionTrayState();

  return {
    selectedKeys: new Set(tray.selectedEntries.map((entry) => entry.previewKey)),
    selectedEntries: tray.selectedEntries,
    isSelected,
    toggle,
    clear,
    count: tray.count,
  };
}
