'use client';

import { useCallback, useEffect, useState } from 'react';

/** Options for initializing inspect mode. */
type UseInspectModeOptions = {
  readonly autoActivate?: boolean;
};

/**
 * Resolve the element that should currently receive the inspect highlight.
 *
 * @param selected - Element selected by the user.
 * @param hovered - Element currently under the cursor.
 * @returns The selected element, hovered element, or `null`.
 * @example
 * const target = resolveHighlightTarget(selected, hovered);
 */
const resolveHighlightTarget = (
  selected: Element | null,
  hovered: Element | null,
): Element | null => {
  if (selected !== null) {
    return selected;
  }

  return hovered;
};

/**
 * Manage Report Mode pick mode state and document event listeners.
 *
 * @param options - Optional initial activation behavior.
 * @returns Inspect mode state, selected element, highlight rect, and actions.
 * @example
 * const inspect = useInspectMode({ autoActivate: true });
 */
// biome-ignore lint/complexity/noExcessiveLinesPerFunction: hook owns one DOM listener lifecycle and related state.
export const useInspectMode = ({ autoActivate = false }: UseInspectModeOptions = {}) => {
  const [active, setActive] = useState(autoActivate);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [selected, setSelected] = useState<Element | null>(null);
  const [note, setNote] = useState('');

  const deactivate = useCallback(() => {
    setActive(false);
    setSelected(null);
    setHovered(null);
    setNote('');
  }, []);

  const toggleActive = useCallback(() => {
    setActive((value) => {
      if (value) {
        setSelected(null);
        setHovered(null);
        setNote('');
      }
      return !value;
    });
  }, []);

  const activate = useCallback(() => {
    setActive(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setNote('');
  }, []);

  const onMouseMove = useCallback(
    ({ target }: MouseEvent) => {
      if (!active || selected) {
        return;
      }
      if (!(target instanceof Element) || target.closest('[data-report-mode-ui]')) {
        return;
      }
      setHovered(target);
    },
    [active, selected],
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (!active || selected) {
        return;
      }
      const { target } = event;
      if (!(target instanceof Element) || target.closest('[data-report-mode-ui]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setSelected(target);
      setHovered(null);
    },
    [active, selected],
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [active, onClick, onMouseMove]);

  const highlightTarget = resolveHighlightTarget(selected, hovered);
  const highlightRect =
    highlightTarget !== null && typeof highlightTarget.getBoundingClientRect === 'function'
      ? highlightTarget.getBoundingClientRect()
      : null;

  return {
    active,
    hovered,
    selected,
    note,
    setNote,
    highlightRect,
    activate,
    deactivate,
    toggleActive,
    clearSelection,
  };
};
