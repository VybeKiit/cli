export type CatalogGridLayoutId = '1x1' | '2x2' | '3x3' | '4x4' | '2x4' | '3x4' | '5x5' | 'custom';

export interface CatalogGridPreset {
  readonly className: string;
  readonly description: string;
  readonly id: Exclude<CatalogGridLayoutId, 'custom'>;
  readonly label: string;
  readonly previewCols: number;
  readonly previewRows: number;
}

/** Built-in grid layout presets for the component catalog. */
export const CATALOG_GRID_PRESETS: CatalogGridPreset[] = [
  {
    id: '1x1',
    label: '1×1',
    description: 'Single column — largest previews, easiest to scan.',
    previewCols: 1,
    previewRows: 2,
    className: 'grid-cols-1',
  },
  {
    id: '2x2',
    label: '2×2',
    description: 'Two columns — balanced default for most screens.',
    previewCols: 2,
    previewRows: 2,
    className: 'grid-cols-1 md:grid-cols-2',
  },
  {
    id: '3x3',
    label: '3×3',
    description: 'Three columns — gallery density on laptops.',
    previewCols: 3,
    previewRows: 3,
    className: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  },
  {
    id: '4x4',
    label: '4×4',
    description: 'Four columns — dense wall on wide displays.',
    previewCols: 4,
    previewRows: 4,
    className: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  {
    id: '2x4',
    label: '2×4',
    description: 'Two on tablet, four on ultrawide — bento-style browsing.',
    previewCols: 4,
    previewRows: 2,
    className: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  },
  {
    id: '3x4',
    label: '3×4',
    description: 'Scales from three up to four columns on large monitors.',
    previewCols: 4,
    previewRows: 3,
    className: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
  },
  {
    id: '5x5',
    label: '5×5',
    description: 'Five columns — maximum density for huge screens.',
    previewCols: 5,
    previewRows: 3,
    className: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5',
  },
];

const CUSTOM_COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

const DEFAULT_LAYOUT: StoredGridLayout = { layoutId: '2x2', customCols: 3 };
/** Browser storage key for the selected catalog grid layout. */
export const CATALOG_GRID_STORAGE_KEY = 'vybekiit-ui-library-grid-layout';

export interface StoredGridLayout {
  readonly customCols: number;
  readonly layoutId: CatalogGridLayoutId;
}

/**
 * Resolve grid class name for the component library.
 *
 * @param layoutId - Input passed to this layoutId parameter.
 * @param customCols - Input passed to this customCols parameter.
 * @returns The value produced by resolveGridClassName.
 * @example
 * const result = resolveGridClassName(layoutId, customCols);
 */
export const resolveGridClassName = (layoutId: CatalogGridLayoutId, customCols: number): string => {
  if (layoutId === 'custom') {
    const cols = Math.min(6, Math.max(1, customCols));
    const customClassName = CUSTOM_COLUMN_CLASSES[cols];
    if (customClassName === undefined) {
      throw new Error(`No grid class registered for ${cols} custom columns.`);
    }
    return customClassName;
  }
  const preset = CATALOG_GRID_PRESETS.find((item) => item.id === layoutId);
  if (preset === undefined) {
    throw new Error(`No catalog grid preset registered for ${layoutId}.`);
  }
  return preset.className;
};

/**
 * Layout label.
 *
 * @param layoutId - Input passed to this layoutId parameter.
 * @param customCols - Input passed to this customCols parameter.
 * @returns The value produced by layoutLabel.
 * @example
 * const result = layoutLabel(layoutId, customCols);
 */
export const layoutLabel = (layoutId: CatalogGridLayoutId, customCols: number): string => {
  if (layoutId === 'custom') {
    return `Custom ${customCols} col`;
  }
  const preset = CATALOG_GRID_PRESETS.find((item) => item.id === layoutId);
  if (preset === undefined) {
    throw new Error(`No catalog grid preset label registered for ${layoutId}.`);
  }
  return preset.label;
};

/**
 * Load stored grid layout from browser storage or catalog data.
 *
 * @returns The loaded value produced by loadStoredGridLayout.
 * @example
 * const result = loadStoredGridLayout();
 */
export const loadStoredGridLayout = (): StoredGridLayout => {
  if (typeof window === 'undefined') {
    return DEFAULT_LAYOUT;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_GRID_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_LAYOUT;
    }
    const parsed = JSON.parse(raw) as Partial<StoredGridLayout>;
    const layoutId = parsed.layoutId === undefined ? DEFAULT_LAYOUT.layoutId : parsed.layoutId;
    const customCols =
      typeof parsed.customCols === 'number'
        ? Math.min(6, Math.max(1, parsed.customCols))
        : DEFAULT_LAYOUT.customCols;
    const validIds: CatalogGridLayoutId[] = [...CATALOG_GRID_PRESETS.map((p) => p.id), 'custom'];
    return {
      layoutId: validIds.includes(layoutId as CatalogGridLayoutId)
        ? (layoutId as CatalogGridLayoutId)
        : '2x2',
      customCols,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
};

/**
 * Save stored grid layout for the component library.
 *
 * @param value - Input passed to this value parameter.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * saveStoredGridLayout(value);
 */
export const saveStoredGridLayout = (value: StoredGridLayout) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CATALOG_GRID_STORAGE_KEY, JSON.stringify(value));
};
