'use client';

import {
  type CatalogGridLayoutId,
  layoutLabel,
  loadStoredGridLayout,
  resolveGridClassName,
  saveStoredGridLayout,
} from '@library/lib/catalogGridLayout';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface CatalogGridLayoutContextValue {
  layoutId: CatalogGridLayoutId;
  customCols: number;
  gridClassName: string;
  layoutLabel: string;
  setLayout: (layoutId: CatalogGridLayoutId, customCols?: number) => void;
}

const CatalogGridLayoutContext = createContext<CatalogGridLayoutContextValue | null>(null);

/**
 * Render the catalog grid layout provider component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <CatalogGridLayoutProvider><App /></CatalogGridLayoutProvider>;
 */
export const CatalogGridLayoutProvider = ({
  children = <></>,
}: {
  readonly children?: ReactNode;
}) => {
  const [layoutId, setLayoutId] = useState<CatalogGridLayoutId>('2x2');
  const [customCols, setCustomCols] = useState(3);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStoredGridLayout();
    setLayoutId(stored.layoutId);
    setCustomCols(stored.customCols);
    setHydrated(true);
  }, []);

  const setLayout = useCallback(
    (nextId: CatalogGridLayoutId, nextCols?: number) => {
      setLayoutId(nextId);
      const cols = nextCols === undefined ? customCols : nextCols;
      if (nextCols !== undefined) {
        setCustomCols(nextCols);
      }
      saveStoredGridLayout({
        layoutId: nextId,
        customCols: nextId === 'custom' ? cols : cols,
      });
    },
    [customCols],
  );

  const value = useMemo(
    () => ({
      layoutId,
      customCols,
      gridClassName: hydrated
        ? resolveGridClassName(layoutId, customCols)
        : 'grid-cols-1 md:grid-cols-2',
      layoutLabel: layoutLabel(layoutId, customCols),
      setLayout,
    }),
    [customCols, hydrated, layoutId, setLayout],
  );

  return (
    <CatalogGridLayoutContext.Provider value={value}>{children}</CatalogGridLayoutContext.Provider>
  );
};

/**
 * Read catalog grid layout state for the component library.
 *
 * @returns The state or callback exposed by useCatalogGridLayout.
 * @example
 * const value = useCatalogGridLayout();
 */
export const useCatalogGridLayout = () => {
  const ctx = useContext(CatalogGridLayoutContext);
  if (!ctx) {
    throw new Error('useCatalogGridLayout must be used within CatalogGridLayoutProvider');
  }
  return ctx;
};
