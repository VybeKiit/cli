'use client';

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vybe-assistant-panel';
const EDGE_MARGIN = 16;
const DEFAULT_PANEL_WIDTH = 380;
const DEFAULT_PANEL_HEIGHT = 560;
/** Within this many px of a screen edge, the panel snaps flush to it on release. */
const SNAP_THRESHOLD = 72;

/** Pixel position for the draggable assistant panel. */
export type PanelPosition = {
  readonly x: number;
  readonly y: number;
};

const DEFAULT_POSITION: PanelPosition = { x: -1, y: 16 };

const parsePanelPosition = (raw: string): PanelPosition | null => {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const record = parsed as { readonly x?: unknown; readonly y?: unknown };

  if (typeof record.x === 'number' && typeof record.y === 'number') {
    return { x: record.x, y: record.y };
  }

  return null;
};

const readStoredPosition = (): PanelPosition => {
  if (typeof globalThis.localStorage === 'undefined') {
    return DEFAULT_POSITION;
  }

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_POSITION;
    }

    const parsed = parsePanelPosition(raw);

    if (parsed !== null) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_POSITION;
};

const writeStoredPosition = (position: PanelPosition): void => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Local storage failures should not interrupt dragging.
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
 * Manage persisted drag position for the floating assistant panel.
 *
 * @param panelWidth - Panel width in pixels for right-edge snapping and clamping.
 * @param panelHeight - Panel height in pixels for vertical clamping.
 * @returns Current position, resolved screen position, and a drag-start handler.
 * @example
 * const drag = useAssistantPanelPosition(380, 560);
 */
export const useAssistantPanelPosition = (
  panelWidth = DEFAULT_PANEL_WIDTH,
  panelHeight = DEFAULT_PANEL_HEIGHT,
): {
  readonly position: PanelPosition;
  readonly resolved: PanelPosition;
  readonly onDragPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
} => {
  const [position, setPosition] = useState<PanelPosition>(DEFAULT_POSITION);

  useEffect(() => {
    setPosition(readStoredPosition());
  }, []);

  const resolved = resolvePanelPosition(position, panelWidth);

  const onDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = resolved;

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
          writeStoredPosition(snapped);
          return snapped;
        });
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
    },
    [panelHeight, panelWidth, resolved],
  );

  return { position, resolved, onDragPointerDown };
};
