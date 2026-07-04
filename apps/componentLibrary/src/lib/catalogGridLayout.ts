export type CatalogGridLayoutId = '1x1' | '2x2' | '3x3' | '4x4' | '2x4' | '3x4' | '5x5' | 'custom';

export interface CatalogGridPreset {
  id: Exclude<CatalogGridLayoutId, 'custom'>;
  label: string;
  description: string;
  previewCols: number;
  previewRows: number;
  className: string;
}

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

export const CATALOG_GRID_STORAGE_KEY = 'vybekiit-ui-library-grid-layout';

export interface StoredGridLayout {
  layoutId: CatalogGridLayoutId;
  customCols: number;
}

export function resolveGridClassName(layoutId: CatalogGridLayoutId, customCols: number): string {
  if (layoutId === 'custom') {
    const cols = Math.min(6, Math.max(1, customCols));
    return CUSTOM_COLUMN_CLASSES[cols] ?? CUSTOM_COLUMN_CLASSES[2]!;
  }
  const preset = CATALOG_GRID_PRESETS.find((item) => item.id === layoutId);
  return preset?.className ?? CATALOG_GRID_PRESETS[1]!.className;
}

export function layoutLabel(layoutId: CatalogGridLayoutId, customCols: number): string {
  if (layoutId === 'custom') {
    return `Custom ${customCols} col`;
  }
  return CATALOG_GRID_PRESETS.find((item) => item.id === layoutId)?.label ?? '2×2';
}

export function loadStoredGridLayout(): StoredGridLayout {
  if (typeof window === 'undefined') {
    return { layoutId: '2x2', customCols: 3 };
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_GRID_STORAGE_KEY);
    if (!raw) {
      return { layoutId: '2x2', customCols: 3 };
    }
    const parsed = JSON.parse(raw) as Partial<StoredGridLayout>;
    const layoutId = parsed.layoutId ?? '2x2';
    const customCols =
      typeof parsed.customCols === 'number' ? Math.min(6, Math.max(1, parsed.customCols)) : 3;
    const validIds: CatalogGridLayoutId[] = [...CATALOG_GRID_PRESETS.map((p) => p.id), 'custom'];
    return {
      layoutId: validIds.includes(layoutId as CatalogGridLayoutId)
        ? (layoutId as CatalogGridLayoutId)
        : '2x2',
      customCols,
    };
  } catch {
    return { layoutId: '2x2', customCols: 3 };
  }
}

export function saveStoredGridLayout(value: StoredGridLayout) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CATALOG_GRID_STORAGE_KEY, JSON.stringify(value));
}
