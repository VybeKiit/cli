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

/** Runtime schema for persisted dock positions. */
export const ReportDockPositionSchema = Schema.Union(CornerPositionSchema, CustomPositionSchema);

const decodeDockPosition = Schema.decodeUnknownEither(ReportDockPositionSchema);

/** Corner anchors for the dev-only Report dock. */
export type ReportDockAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';

/** Persisted Report dock position. */
export type ReportDockPosition = {
  readonly anchor: ReportDockAnchor;
  /** Pixels from the left viewport edge when `anchor` is `custom`. */
  readonly customX?: number;
  /** Pixels from the top viewport edge when `anchor` is `custom`. */
  readonly customY?: number;
};

/** Browser storage key for persisted Report dock position. */
export const REPORT_DOCK_STORAGE_KEY = 'vybekiit-report-dock-position';

/** Default Report dock position. */
export const DEFAULT_DOCK_POSITION: ReportDockPosition = { anchor: 'bottom-right' };

const DOCK_MARGIN_PX = 16;

/** CSS placement for a fixed Report dock. */
export type DockPlacementStyle = {
  readonly top?: string;
  readonly bottom?: string;
  readonly left?: string;
  readonly right?: string;
  readonly transform?: string;
};

/** Minimal storage surface: `localStorage` in browser, injectable in tests. */
export type DockPositionStorage = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
};

const getDockPlacementByAnchor = (
  margin: string,
): Record<Exclude<ReportDockAnchor, 'custom'>, DockPlacementStyle> => ({
  'top-left': { top: margin, left: margin },
  'top-right': { top: margin, right: margin },
  'bottom-left': { bottom: margin, left: margin },
  'bottom-right': { bottom: margin, right: margin },
});

/**
 * Parse a serialized dock position from storage.
 *
 * @param raw - Raw JSON string from storage.
 * @returns Parsed dock position, or the default when absent or invalid.
 * @example
 * const position = parsePosition(localStorage.getItem(REPORT_DOCK_STORAGE_KEY));
 */
const parsePosition = (raw: string | null): ReportDockPosition => {
  if (raw === null || raw.length === 0) {
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
};

/**
 * Load the persisted Report dock position.
 *
 * @param store - Storage implementation or `null` when unavailable.
 * @returns Persisted dock position, or the default position.
 * @example
 * const position = loadDockPosition(localStorage);
 */
export const loadDockPosition = (store: DockPositionStorage | null): ReportDockPosition => {
  if (store === null) {
    return DEFAULT_DOCK_POSITION;
  }
  return parsePosition(store.getItem(REPORT_DOCK_STORAGE_KEY));
};

/**
 * Persist the Report dock position.
 *
 * @param store - Storage implementation or `null` when unavailable.
 * @param position - Dock position to persist.
 * @returns Nothing.
 * @example
 * saveDockPosition(localStorage, { anchor: 'bottom-right' });
 */
export const saveDockPosition = (
  store: DockPositionStorage | null,
  position: ReportDockPosition,
): void => {
  if (store === null) {
    return;
  }
  store.setItem(REPORT_DOCK_STORAGE_KEY, JSON.stringify(position));
};

/**
 * Convert a dock position to fixed CSS coordinates.
 *
 * @param position - Dock position selected by the user.
 * @returns CSS placement values for a fixed dock.
 * @example
 * const style = getDockPlacementStyle({ anchor: 'bottom-right' });
 */
export const getDockPlacementStyle = (position: ReportDockPosition): DockPlacementStyle => {
  if (position.anchor === 'custom') {
    const x = position.customX === undefined ? DOCK_MARGIN_PX : position.customX;
    const y = position.customY === undefined ? DOCK_MARGIN_PX : position.customY;
    return { top: `${y}px`, left: `${x}px` };
  }
  const margin = `${DOCK_MARGIN_PX}px`;
  return getDockPlacementByAnchor(margin)[position.anchor];
};

/** Inputs for snapping a drag end point to a dock corner. */
export type SnapDockToNearestCornerInput = {
  readonly x: number;
  readonly y: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly thresholdPx?: number;
};

/**
 * Snap a drag end point to the nearest corner.
 *
 * @param input - Drag end point, viewport dimensions, and optional snap threshold.
 * @returns A corner position when near a corner, otherwise a custom position.
 * @example
 * const position = snapDockToNearestCorner({ x: 950, y: 650, viewportWidth: 1000, viewportHeight: 700 });
 */
export const snapDockToNearestCorner = ({
  x,
  y,
  viewportWidth,
  viewportHeight,
  thresholdPx = 80,
}: SnapDockToNearestCornerInput): ReportDockPosition => {
  const corners: { readonly anchor: Exclude<ReportDockAnchor, 'custom'>; readonly d: number }[] = [
    { anchor: 'top-left', d: Math.hypot(x, y) },
    { anchor: 'top-right', d: Math.hypot(viewportWidth - x, y) },
    { anchor: 'bottom-left', d: Math.hypot(x, viewportHeight - y) },
    { anchor: 'bottom-right', d: Math.hypot(viewportWidth - x, viewportHeight - y) },
  ];
  corners.sort((a, b) => a.d - b.d);
  const [nearest] = corners;
  if (nearest !== undefined && nearest.d <= thresholdPx) {
    return { anchor: nearest.anchor };
  }
  return { anchor: 'custom', customX: x, customY: y };
};

/** How a flyout aligns to its trigger along the horizontal axis. */
export type FlyoutAlign = 'center' | 'end';

/** Minimal rect shape so this stays testable without a DOM. */
export type FlyoutRect = {
  readonly top: number;
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
};

/** Viewport dimensions used for flyout placement. */
export type FlyoutViewport = {
  readonly width: number;
  readonly height: number;
};

/** Inputs for pure flyout placement calculation. */
export type ComputeFlyoutPlacementInput = {
  readonly trigger: FlyoutRect;
  readonly flyout: Pick<FlyoutRect, 'width' | 'height'>;
  readonly viewport: FlyoutViewport;
  readonly align?: FlyoutAlign;
  readonly gap?: number;
  readonly margin?: number;
};

/** Fixed-position coordinates for a hover flyout, clamped inside the viewport. */
export type FlyoutPlacement = {
  readonly left: number;
  readonly top: number;
};

/**
 * Clamp a number into an inclusive range.
 *
 * @param value - Number to clamp.
 * @param min - Minimum allowed value.
 * @param max - Maximum allowed value.
 * @returns The clamped number.
 * @example
 * const x = clamp(rawLeft, 8, 832);
 */
const clamp = (value: number, min: number, max: number): number => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

/**
 * Place a hover flyout near its trigger while keeping it inside the viewport.
 *
 * @param input - Trigger, flyout, viewport, and spacing inputs.
 * @returns Top-left coordinates for a `position: fixed` flyout.
 * @example
 * const placement = computeFlyoutPlacement({ trigger, flyout, viewport });
 */
export const computeFlyoutPlacement = ({
  trigger,
  flyout,
  viewport,
  align = 'center',
  gap = 8,
  margin = 8,
}: ComputeFlyoutPlacementInput): FlyoutPlacement => {
  const rawLeft =
    align === 'end'
      ? trigger.right - flyout.width
      : trigger.left + trigger.width / 2 - flyout.width / 2;
  const left = clamp(rawLeft, margin, viewport.width - flyout.width - margin);

  const spaceAbove = trigger.top - gap;
  const fitsAbove = spaceAbove >= flyout.height + margin;
  const rawTop = fitsAbove ? trigger.top - gap - flyout.height : trigger.bottom + gap;
  const top = clamp(rawTop, margin, viewport.height - flyout.height - margin);

  return { left, top };
};

/** Numeric insets for React Native absolute positioning. */
export type DockInsetStyle = {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
};

const getDockInsetsByAnchor = (
  marginPx: number,
): Record<Exclude<ReportDockAnchor, 'custom'>, DockInsetStyle> => ({
  'top-left': { top: marginPx, left: marginPx },
  'top-right': { top: marginPx, right: marginPx },
  'bottom-left': { bottom: marginPx, left: marginPx },
  'bottom-right': { bottom: marginPx, right: marginPx },
});

/**
 * Convert a corner anchor to numeric inset values.
 *
 * @param anchor - Corner anchor selected for the dock.
 * @param marginPx - Margin from viewport edges in pixels.
 * @returns Numeric inset values for absolute positioning.
 * @example
 * const insets = getDockInsetStyle('bottom-right');
 */
export const getDockInsetStyle = (
  anchor: Exclude<ReportDockAnchor, 'custom'>,
  marginPx = DOCK_MARGIN_PX,
): DockInsetStyle => getDockInsetsByAnchor(marginPx)[anchor];

/**
 * Load saved dock position but return only a corner anchor.
 *
 * @param store - Storage implementation or `null` when unavailable.
 * @returns Persisted corner anchor, or `bottom-right` for custom positions.
 * @example
 * const anchor = loadDockCornerOnly(localStorage);
 */
export const loadDockCornerOnly = (
  store: DockPositionStorage | null,
): Exclude<ReportDockAnchor, 'custom'> => {
  const position = loadDockPosition(store);
  if (position.anchor === 'custom') {
    return 'bottom-right';
  }
  return position.anchor;
};

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
