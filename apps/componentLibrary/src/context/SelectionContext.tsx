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

/**
 * Render the selection provider component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <SelectionProvider><App /></SelectionProvider>;
 */
export const SelectionProvider = ({ children }: { readonly children: ReactNode }) => {
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
};

const useSelectionActions = (): SelectionActionsValue => {
  const ctx = useContext(SelectionActionsContext);
  if (!ctx) {
    throw new Error('useSelectionActions must be used within SelectionProvider');
  }
  return ctx;
};

/**
 * Subscribe one catalog card to its selected state.
 *
 * @param previewKey - Stable catalog preview key to observe.
 * @returns Whether the entry is currently selected.
 * @example
 * const selected = useIsSelected(entry.previewKey);
 */
export const useIsSelected = (previewKey: string): boolean =>
  useSyncExternalStore(
    (listener) => subscribeSelectionKey(previewKey, listener),
    () => isEntrySelected(previewKey),
    () => false,
  );

/**
 * Read the selection toggle callback from context.
 *
 * @returns A callback that toggles a catalog entry by preview key.
 * @example
 * const toggle = useSelectionToggle();
 */
export const useSelectionToggle = (): ((previewKey: string) => void) =>
  useSelectionActions().toggle;

/**
 * Subscribe the tray to selected entries and count.
 *
 * @returns Selection count, selected catalog entries, and a clear callback.
 * @example
 * const tray = useSelectionTrayState();
 */
export const useSelectionTrayState = (): {
  readonly count: number;
  readonly selectedEntries: CatalogEntry[];
  readonly clear: () => void;
} => {
  const catalog = useCatalogData();
  const { clear } = useSelectionActions();
  const count = useSyncExternalStore(subscribeSelection, getSelectionCount, () => 0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute when the selection count changes (store read)
  const selectedEntries = useMemo(
    () => resolveSelectedEntries(catalog.byKey),
    [catalog.byKey, count],
  );

  return { count, selectedEntries, clear };
};

/**
 * Reads the legacy selection context shape.
 *
 * @returns Selected keys, selected entries, and selection actions.
 * @example
 * const selection = useSelection();
 * @deprecated Prefer `useIsSelected` + `useSelectionToggle` on cards.
 */
export const useSelection = () => {
  const { toggle, clear } = useSelectionActions();
  const tray = useSelectionTrayState();

  return {
    selectedKeys: new Set(tray.selectedEntries.map((entry) => entry.previewKey)),
    selectedEntries: tray.selectedEntries,
    isSelected: isEntrySelected,
    toggle,
    clear,
    count: tray.count,
  };
};
