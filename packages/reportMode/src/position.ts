import { Either, Schema } from 'effect';

const CornerAnchor = Schema.Literal('top-left', 'top-right', 'bottom-left', 'bottom-right');

const CornerPositionSchema = Schema.Struct({
  anchor: CornerAnchor,
});

const CustomPositionSchema = Schema.Struct({
  anchor: Schema.Literal('custom'),
  customX: Schema.Number,
  customY: Schema.Number,
});

export const ReportDockPositionSchema = Schema.Union(CornerPositionSchema, CustomPositionSchema);

const decodeDockPosition = Schema.decodeUnknownEither(ReportDockPositionSchema);

/** Corner anchors for the dev-only Report dock. */
export type ReportDockAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

export interface ReportDockPosition {
  readonly anchor: ReportDockAnchor;
  /** Pixels from the left viewport edge when `anchor` is `custom`. */
  readonly customX?: number;
  /** Pixels from the top viewport edge when `anchor` is `custom`. */
  readonly customY?: number;
}

export const REPORT_DOCK_STORAGE_KEY = 'vybekiit-report-dock-position';

export const DEFAULT_DOCK_POSITION: ReportDockPosition = { anchor: 'bottom-right' };

const DOCK_MARGIN_PX = 16;

/** CSS placement for a fixed Report dock (works in browser and unit tests). */
export interface DockPlacementStyle {
  readonly top?: string;
  readonly bottom?: string;
  readonly left?: string;
  readonly right?: string;
  readonly transform?: string;
}

/** Minimal storage surface — `localStorage` in browser, injectable in tests. */
export interface DockPositionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function parsePosition(raw: string | null): ReportDockPosition {
  if (!raw) {
    return DEFAULT_DOCK_POSITION;
  }
  try {
    const parsed = decodeDockPosition(JSON.parse(raw));
    if (Either.isLeft(parsed)) {
      return DEFAULT_DOCK_POSITION;
    }
    return parsed.right;
  } catch {
    return DEFAULT_DOCK_POSITION;
  }
}

export function loadDockPosition(store: DockPositionStorage | null): ReportDockPosition {
  if (!store) {
    return DEFAULT_DOCK_POSITION;
  }
  return parsePosition(store.getItem(REPORT_DOCK_STORAGE_KEY));
}

export function saveDockPosition(
  store: DockPositionStorage | null,
  position: ReportDockPosition,
): void {
  if (!store) {
    return;
  }
  store.setItem(REPORT_DOCK_STORAGE_KEY, JSON.stringify(position));
}

/** Convert a dock position to fixed CSS coordinates. */
export function getDockPlacementStyle(position: ReportDockPosition): DockPlacementStyle {
  if (position.anchor === 'custom') {
    const x = position.customX ?? DOCK_MARGIN_PX;
    const y = position.customY ?? DOCK_MARGIN_PX;
    return { top: `${y}px`, left: `${x}px` };
  }
  const margin = `${DOCK_MARGIN_PX}px`;
  switch (position.anchor) {
    case 'top-left':
      return { top: margin, left: margin };
    case 'top-right':
      return { top: margin, right: margin };
    case 'bottom-left':
      return { bottom: margin, left: margin };
    case 'bottom-right':
      return { bottom: margin, right: margin };
  }
}

/** Snap a drag end point to the nearest corner when within `thresholdPx`. */
export function snapDockToNearestCorner(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  thresholdPx = 80,
): ReportDockPosition {
  const corners: { anchor: Exclude<ReportDockAnchor, 'custom'>; d: number }[] = [
    { anchor: 'top-left', d: Math.hypot(x, y) },
    { anchor: 'top-right', d: Math.hypot(viewportWidth - x, y) },
    { anchor: 'bottom-left', d: Math.hypot(x, viewportHeight - y) },
    { anchor: 'bottom-right', d: Math.hypot(viewportWidth - x, viewportHeight - y) },
  ];
  corners.sort((a, b) => a.d - b.d);
  const nearest = corners[0];
  if (nearest && nearest.d <= thresholdPx) {
    return { anchor: nearest.anchor };
  }
  return { anchor: 'custom', customX: x, customY: y };
}

/** Numeric insets for React Native absolute positioning (FAB / dock). */
export interface DockInsetStyle {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
}

export function getDockInsetStyle(
  anchor: Exclude<ReportDockAnchor, 'custom'>,
  marginPx = DOCK_MARGIN_PX,
): DockInsetStyle {
  switch (anchor) {
    case 'top-left':
      return { top: marginPx, left: marginPx };
    case 'top-right':
      return { top: marginPx, right: marginPx };
    case 'bottom-left':
      return { bottom: marginPx, left: marginPx };
    case 'bottom-right':
      return { bottom: marginPx, right: marginPx };
  }
}

/** Load saved dock position but only return a corner anchor (mobile — no custom drag). */
export function loadDockCornerOnly(
  store: DockPositionStorage | null,
): Exclude<ReportDockAnchor, 'custom'> {
  const position = loadDockPosition(store);
  if (position.anchor === 'custom') {
    return 'bottom-right';
  }
  return position.anchor;
}

/** All corner presets shown in the dock settings row. */
export const DOCK_CORNER_PRESETS: readonly Exclude<ReportDockAnchor, 'custom'>[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

/** Plain-language corner labels for the builder-facing dock picker. */
export const DOCK_CORNER_LABELS: Record<Exclude<ReportDockAnchor, 'custom'>, string> = {
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
};
