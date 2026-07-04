'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Small delay before expanding on hover — avoids flicker when the cursor just grazes the chip. */
const HOVER_OPEN_DELAY_MS = 90;
/** Longer delay before collapsing — keeps the dock open across small cursor gaps to sub-menus. */
const HOVER_CLOSE_DELAY_MS = 260;

const REPORT_DOCK_EXPANDED_KEY = 'vybekiit-report-dock-expanded';
/** @deprecated Use REPORT_DOCK_EXPANDED_KEY */
const REPORT_DOCK_EXPANDED_LOCK_KEY = 'vybekiit-report-dock-expanded-lock';

function browserStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readPinnedExpanded(): boolean {
  try {
    const storage = browserStorage();
    const next = storage?.getItem(REPORT_DOCK_EXPANDED_KEY);
    if (next === 'true' || next === 'false') {
      return next === 'true';
    }
    // Migrate legacy “lock open forever” flag.
    if (storage?.getItem(REPORT_DOCK_EXPANDED_LOCK_KEY) === 'true') {
      storage.setItem(REPORT_DOCK_EXPANDED_KEY, 'true');
      storage.removeItem(REPORT_DOCK_EXPANDED_LOCK_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Collapsed chip by default; hover or pin expands; VybeKiit chip toggles pin. */
export function useReportDockCollapse() {
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [dockHovered, setDockHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPinnedExpanded(readPinnedExpanded());
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  // Debounced hover so a grazing cursor or the gap to a sub-menu doesn't flicker the dock.
  const onDockEnter = useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setDockHovered(true), HOVER_OPEN_DELAY_MS);
  }, [clearHoverTimer]);

  const onDockLeave = useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setDockHovered(false), HOVER_CLOSE_DELAY_MS);
  }, [clearHoverTimer]);

  useEffect(() => clearHoverTimer, [clearHoverTimer]);

  const toggleExpanded = useCallback(() => {
    setPinnedExpanded((value) => {
      const next = !value;
      if (!next) {
        clearHoverTimer();
        setDockHovered(false);
      }
      try {
        browserStorage()?.setItem(REPORT_DOCK_EXPANDED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [clearHoverTimer]);

  const isExpanded = pinnedExpanded || dockHovered;

  return {
    dockHovered,
    pinnedExpanded,
    isExpanded,
    toggleExpanded,
    onDockEnter,
    onDockLeave,
  };
}
