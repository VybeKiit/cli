'use client';

import { useCallback, useEffect, useState } from 'react';

type UseInspectModeOptions = {
  readonly autoActivate?: boolean;
};

/** Pick mode — hover highlight, click to select an element for reporting. */
export function useInspectMode({ autoActivate = false }: UseInspectModeOptions = {}) {
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

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!active || selected) {
        return;
      }
      const target = event.target;
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
      const target = event.target;
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

  const highlightTarget = selected ?? hovered;
  const highlightRect =
    highlightTarget && typeof highlightTarget.getBoundingClientRect === 'function'
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
    clearSelection: () => {
      setSelected(null);
      setNote('');
    },
  };
}
