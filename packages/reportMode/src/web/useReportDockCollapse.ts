'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveBrowserStorage } from './browserStorage';

/** Small delay before expanding on hover. */
const HOVER_OPEN_DELAY_MS = 90;
/** Longer delay before collapsing across small cursor gaps to sub-menus. */
const HOVER_CLOSE_DELAY_MS = 260;

const REPORT_DOCK_EXPANDED_KEY = 'vybekiit-report-dock-expanded';
/** @deprecated Use REPORT_DOCK_EXPANDED_KEY */
const REPORT_DOCK_EXPANDED_LOCK_KEY = 'vybekiit-report-dock-expanded-lock';

/**
 * Read whether the dock is pinned open from browser storage.
 *
 * @returns `true` when the persisted setting pins the dock open.
 * @example
 * const pinned = readPinnedExpanded();
 */
const readPinnedExpanded = (): boolean => {
  try {
    const storage = resolveBrowserStorage();
    if (storage === null) {
      return false;
    }

    const next = storage.getItem(REPORT_DOCK_EXPANDED_KEY);
    if (next === 'true' || next === 'false') {
      return next === 'true';
    }

    if (storage.getItem(REPORT_DOCK_EXPANDED_LOCK_KEY) === 'true') {
      storage.setItem(REPORT_DOCK_EXPANDED_KEY, 'true');
      storage.removeItem(REPORT_DOCK_EXPANDED_LOCK_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Manage collapsed, hovered, and pinned Report dock expansion state.
 *
 * @returns Dock expansion state and event handlers for hover/pin interactions.
 * @example
 * const dock = useReportDockCollapse();
 */
export const useReportDockCollapse = () => {
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [dockHovered, setDockHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPinnedExpanded(readPinnedExpanded());
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

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
        const storage = resolveBrowserStorage();
        if (storage !== null) {
          storage.setItem(REPORT_DOCK_EXPANDED_KEY, String(next));
        }
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
};
