'use client';

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vybe-assistant-panel';

export interface PanelPosition {
  readonly x: number;
  readonly y: number;
}

const DEFAULT_POSITION: PanelPosition = { x: -1, y: 16 };

function readStoredPosition(): PanelPosition {
  if (typeof window === 'undefined') {
    return DEFAULT_POSITION;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_POSITION;
    }
    const parsed = JSON.parse(raw) as PanelPosition;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_POSITION;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const EDGE_MARGIN = 16;
/** Within this many px of a screen edge, the panel snaps flush to it on release. */
const SNAP_THRESHOLD = 72;

/** Pull a released position flush to the nearest left/right edge when it lands close to one. */
function snapToEdge(pos: PanelPosition, panelWidth: number): PanelPosition {
  const leftGap = pos.x;
  const rightGap = window.innerWidth - (pos.x + panelWidth);
  if (leftGap <= SNAP_THRESHOLD && leftGap <= rightGap) {
    return { x: EDGE_MARGIN, y: pos.y };
  }
  if (rightGap <= SNAP_THRESHOLD) {
    return { x: Math.max(EDGE_MARGIN, window.innerWidth - panelWidth - EDGE_MARGIN), y: pos.y };
  }
  return pos;
}

export function useAssistantPanelPosition(
  panelWidth = 380,
  panelHeight = 560,
): {
  readonly position: PanelPosition;
  readonly resolved: PanelPosition;
  readonly onDragPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
} {
  const [position, setPosition] = useState<PanelPosition>(DEFAULT_POSITION);

  useEffect(() => {
    setPosition(readStoredPosition());
  }, []);

  const resolved: PanelPosition =
    position.x < 0
      ? {
          x: Math.max(16, window.innerWidth - panelWidth - 16),
          y: position.y,
        }
      : position;

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

      function onMove(moveEvent: globalThis.PointerEvent) {
        const next = {
          x: clamp(origin.x + (moveEvent.clientX - startX), 8, window.innerWidth - panelWidth - 8),
          y: clamp(
            origin.y + (moveEvent.clientY - startY),
            8,
            window.innerHeight - panelHeight - 8,
          ),
        };
        setPosition(next);
      }

      function onUp() {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        setPosition((current) => {
          const snapped = snapToEdge(current, panelWidth);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
          return snapped;
        });
      }

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
    },
    [panelHeight, panelWidth, resolved],
  );

  return { position, resolved, onDragPointerDown };
}
