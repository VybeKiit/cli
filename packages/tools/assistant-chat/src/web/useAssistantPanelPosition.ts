'use client';

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vybe-assistant-panel';
const EDGE_MARGIN = 16;
const DEFAULT_PANEL_WIDTH = 400;
const DEFAULT_PANEL_HEIGHT = 620;
const MIN_PANEL_WIDTH = 320;
const MIN_PANEL_HEIGHT = 420;
/** Within this many px of a screen edge, the panel snaps flush to it on release. */
const SNAP_THRESHOLD = 72;

/** Pixel position for the draggable assistant panel. */
export type PanelPosition = {
  readonly x: number;
  readonly y: number;
};

/** Pixel size for the resizable assistant panel. */
export type PanelSize = {
  readonly width: number;
  readonly height: number;
};

type StoredLayout = PanelPosition & PanelSize;

const DEFAULT_POSITION: PanelPosition = { x: -1, y: 16 };
const DEFAULT_SIZE: PanelSize = { width: DEFAULT_PANEL_WIDTH, height: DEFAULT_PANEL_HEIGHT };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const parseStoredLayout = (raw: string): Partial<StoredLayout> | null => {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const record = parsed as {
    readonly x?: unknown;
    readonly y?: unknown;
    readonly width?: unknown;
    readonly height?: unknown;
  };

  const hasPosition = isFiniteNumber(record.x) && isFiniteNumber(record.y);
  const hasSize = isFiniteNumber(record.width) && isFiniteNumber(record.height);

  if (!(hasPosition || hasSize)) {
    return null;
  }

  return {
    ...(hasPosition ? { x: record.x, y: record.y } : {}),
    ...(hasSize ? { width: record.width, height: record.height } : {}),
  };
};

const readStoredLayout = (): { position: PanelPosition; size: PanelSize } => {
  if (typeof globalThis.localStorage === 'undefined') {
    return { position: DEFAULT_POSITION, size: DEFAULT_SIZE };
  }

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { position: DEFAULT_POSITION, size: DEFAULT_SIZE };
    }

    const parsed = parseStoredLayout(raw);
    if (parsed === null) {
      return { position: DEFAULT_POSITION, size: DEFAULT_SIZE };
    }

    return {
      position:
        parsed.x !== undefined && parsed.y !== undefined
          ? { x: parsed.x, y: parsed.y }
          : DEFAULT_POSITION,
      size:
        parsed.width !== undefined && parsed.height !== undefined
          ? { width: parsed.width, height: parsed.height }
          : DEFAULT_SIZE,
    };
  } catch {
    return { position: DEFAULT_POSITION, size: DEFAULT_SIZE };
  }
};

const writeStoredLayout = (position: PanelPosition, size: PanelSize): void => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  try {
    const payload: StoredLayout = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    };
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage failures should not interrupt dragging/resizing.
  }
};

const viewportWidth = (): number => {
  if (typeof globalThis.innerWidth === 'number') {
    return globalThis.innerWidth;
  }

  return DEFAULT_PANEL_WIDTH + EDGE_MARGIN * 2;
};

const viewportHeight = (): number => {
  if (typeof globalThis.innerHeight === 'number') {
    return globalThis.innerHeight;
  }

  return DEFAULT_PANEL_HEIGHT + EDGE_MARGIN * 2;
};

const clamp = (value: number, min: number, max: number): number => {
  const upper = Math.max(min, max);
  return Math.min(Math.max(value, min), upper);
};

const maxPanelWidth = (): number => Math.max(MIN_PANEL_WIDTH, viewportWidth() - EDGE_MARGIN * 2);
const maxPanelHeight = (): number => Math.max(MIN_PANEL_HEIGHT, viewportHeight() - EDGE_MARGIN * 2);

const clampSize = (size: PanelSize): PanelSize => ({
  width: clamp(size.width, MIN_PANEL_WIDTH, maxPanelWidth()),
  height: clamp(size.height, MIN_PANEL_HEIGHT, maxPanelHeight()),
});

const snapToEdge = (pos: PanelPosition, panelWidth: number): PanelPosition => {
  const leftGap = pos.x;
  const rightGap = viewportWidth() - (pos.x + panelWidth);
  if (leftGap <= SNAP_THRESHOLD && leftGap <= rightGap) {
    return { x: EDGE_MARGIN, y: pos.y };
  }
  if (rightGap <= SNAP_THRESHOLD) {
    return { x: Math.max(EDGE_MARGIN, viewportWidth() - panelWidth - EDGE_MARGIN), y: pos.y };
  }
  return pos;
};

const resolvePanelPosition = (position: PanelPosition, panelWidth: number): PanelPosition => {
  if (position.x >= 0) {
    return position;
  }

  return {
    x: Math.max(EDGE_MARGIN, viewportWidth() - panelWidth - EDGE_MARGIN),
    y: position.y,
  };
};

/**
 * Manage persisted drag position + resize size for the floating assistant panel.
 *
 * @param defaultWidth - Initial width when nothing is stored.
 * @param defaultHeight - Initial height when nothing is stored.
 * @returns Position, size, drag handler, and resize handler.
 * @example
 * const layout = useAssistantPanelPosition(400, 620);
 */
export const useAssistantPanelPosition = (
  defaultWidth = DEFAULT_PANEL_WIDTH,
  defaultHeight = DEFAULT_PANEL_HEIGHT,
): {
  readonly position: PanelPosition;
  readonly resolved: PanelPosition;
  readonly size: PanelSize;
  readonly onDragPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onResizePointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
} => {
  const [position, setPosition] = useState<PanelPosition>(DEFAULT_POSITION);
  const [size, setSize] = useState<PanelSize>({
    width: defaultWidth,
    height: defaultHeight,
  });

  useEffect(() => {
    const stored = readStoredLayout();
    setPosition(stored.position);
    setSize(clampSize(stored.size));
  }, []);

  const resolved = resolvePanelPosition(position, size.width);

  const onDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      // Header hosts theme/close/help buttons — never start a drag from those.
      const eventTarget = event.target;
      if (eventTarget instanceof Element) {
        const interactive = eventTarget.closest(
          'button, a, input, textarea, select, [role="menuitem"], [data-no-drag], [data-resize-handle]',
        );
        if (interactive !== null) {
          return;
        }
      }
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = resolved;
      const panelWidth = size.width;
      const panelHeight = size.height;

      const onMove = (moveEvent: globalThis.PointerEvent): void => {
        const next = {
          x: clamp(origin.x + (moveEvent.clientX - startX), 8, viewportWidth() - panelWidth - 8),
          y: clamp(origin.y + (moveEvent.clientY - startY), 8, viewportHeight() - panelHeight - 8),
        };
        setPosition(next);
      };

      const onUp = (): void => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        setPosition((current) => {
          const snapped = snapToEdge(current, panelWidth);
          writeStoredLayout(snapped, { width: panelWidth, height: panelHeight });
          return snapped;
        });
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
    },
    [resolved, size.height, size.width],
  );

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startY = event.clientY;
      const originSize = size;
      const originPos = resolved;

      const onMove = (moveEvent: globalThis.PointerEvent): void => {
        const nextSize = clampSize({
          width: originSize.width + (moveEvent.clientX - startX),
          height: originSize.height + (moveEvent.clientY - startY),
        });
        // Keep the panel inside the viewport while growing.
        const maxW = viewportWidth() - originPos.x - EDGE_MARGIN;
        const maxH = viewportHeight() - originPos.y - EDGE_MARGIN;
        setSize({
          width: Math.min(nextSize.width, maxW),
          height: Math.min(nextSize.height, maxH),
        });
      };

      const onUp = (): void => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        setSize((current) => {
          const clamped = clampSize(current);
          writeStoredLayout(originPos, clamped);
          return clamped;
        });
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
    },
    [resolved, size],
  );

  return { position, resolved, size, onDragPointerDown, onResizePointerDown };
};
