'use client';

import { useCallback, useEffect, useState } from 'react';

export const REPORT_DOCK_EXPANDED_KEY = 'vybekiit-report-dock-expanded';
/** @deprecated Use REPORT_DOCK_EXPANDED_KEY */
export const REPORT_DOCK_EXPANDED_LOCK_KEY = 'vybekiit-report-dock-expanded-lock';

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
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

  useEffect(() => {
    setPinnedExpanded(readPinnedExpanded());
  }, []);

  const toggleExpanded = useCallback(() => {
    setPinnedExpanded((value) => {
      const next = !value;
      if (!next) {
        setDockHovered(false);
      }
      try {
        browserStorage()?.setItem(REPORT_DOCK_EXPANDED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isExpanded = pinnedExpanded || dockHovered;

  return {
    dockHovered,
    pinnedExpanded,
    isExpanded,
    toggleExpanded,
    onDockEnter: () => setDockHovered(true),
    onDockLeave: () => setDockHovered(false),
  };
}
