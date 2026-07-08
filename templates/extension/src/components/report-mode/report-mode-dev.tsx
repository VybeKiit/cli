'use client';

import { Button } from '@/components/ui/button';
import { ReportModeNotePanel } from '@/components/report-mode/inspect/report-mode-note-panel';
import { useConsoleErrorBuffer } from '@/components/report-mode/useConsoleErrors';
import { useReportDockPosition } from '@/components/report-mode/useReportDock';
import { useReportInspectHighlightColor } from '@/components/report-mode/useReportInspectHighlightColor';
import {
  getAccessibleName,
  getCssPath,
  getShortestUniqueLabel,
  getVisibleText,
} from '@/lib/report-mode/domUtils';
import { submitExtensionReport } from '@/lib/report-mode/submitReport';
import {
  DOCK_CORNER_LABELS,
  DOCK_CORNER_PRESETS,
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  hexToRgba,
  INSPECT_HIGHLIGHT_PRESETS,
  REPORT_MODE_HOTKEY_LABEL,
  getDockPlacementStyle,
  snapDockToNearestCorner,
} from '@vybekiit/report-mode';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import '../../../styles/report-mode-note.css';

/**
 * Check whether a keyboard event matches the report-mode hotkey.
 *
 * @param event - Keyboard event to inspect.
 * @returns True when the event should toggle report mode.
 * @example
 * const active = isReportHotkey(event);
 */
const isReportHotkey = (event: KeyboardEvent): boolean =>
  event.altKey && event.shiftKey && event.key.toLowerCase() === 'r';

/**
 * Render the dev-only extension report-mode dock.
 *
 * @returns The report-mode dock, highlight overlay, and note panel in development builds.
 * @example
 * <ReportModeDev />
 */
export const ReportModeDev = () => {
  const errorBuffer = useConsoleErrorBuffer();
  const { position, savePosition, setCorner } = useReportDockPosition();
  const {
    color: highlightColor,
    setColor: setHighlightColor,
    resetColor: resetHighlightColor,
  } = useReportInspectHighlightColor();
  const dockRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [selected, setSelected] = useState<Element | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copyingSpot, setCopyingSpot] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showCorners, setShowCorners] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const spotLabel = useMemo(() => (selected ? getShortestUniqueLabel(selected) : ''), [selected]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!isReportHotkey(event)) {
        return;
      }
      event.preventDefault();
      toggleActive();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleActive]);

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

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const onPointerMove = (event: PointerEvent): void => {
      const x = event.clientX - dragOffset.current.x;
      const y = event.clientY - dragOffset.current.y;
      savePosition({ anchor: 'custom', customX: Math.max(0, x), customY: Math.max(0, y) });
    };
    const onPointerUp = (event: PointerEvent): void => {
      setDragging(false);
      const snapped = snapDockToNearestCorner({
        x: event.clientX - dragOffset.current.x,
        y: event.clientY - dragOffset.current.y,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
      savePosition(snapped);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragging, savePosition]);

  const onDragHandlePointerDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    const rect = dockRef.current?.getBoundingClientRect();
    const left = rect === undefined ? event.clientX : rect.left;
    const top = rect === undefined ? event.clientY : rect.top;
    dragOffset.current = { x: event.clientX - left, y: event.clientY - top };
    setDragging(true);
  };

  const handleCopySpot = async (): Promise<void> => {
    if (!spotLabel.trim()) {
      return;
    }
    setCopyingSpot(true);
    try {
      await navigator.clipboard.writeText(spotLabel);
    } finally {
      setCopyingSpot(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!(selected && note.trim())) {
      return;
    }
    setSubmitting(true);
    try {
      const a11yName = getAccessibleName(selected);
      const visibleText = getVisibleText(selected);
      await submitExtensionReport({
        route: 'extension-popup',
        selector: getCssPath(selected),
        spotLabel,
        ...(a11yName === undefined ? {} : { a11yName }),
        ...(visibleText === undefined ? {} : { visibleText }),
        consoleErrors: errorBuffer.snapshot(),
        builderNote: note.trim(),
      });
      deactivate();
    } finally {
      setSubmitting(false);
    }
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  const highlightTarget = selected === null ? hovered : selected;
  const highlightRect = highlightTarget === null ? null : highlightTarget.getBoundingClientRect();
  const dockStyle = getDockPlacementStyle(position) as CSSProperties;

  return (
    <>
      {active ? (
        <div
          data-report-mode-ui={true}
          data-testid="report-mode-banner"
          className="pointer-events-none fixed inset-x-0 top-0 z-[9998] bg-amber-500/90 px-2 py-1 text-center text-xs font-medium text-amber-950"
        >
          Click what looks wrong ({REPORT_MODE_HOTKEY_LABEL} to turn off)
        </div>
      ) : null}

      {active && highlightRect ? (
        <div
          data-report-mode-ui={true}
          data-testid="report-mode-highlight"
          className="pointer-events-none fixed z-[9997] rounded border-2"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            borderColor: highlightColor,
            backgroundColor: hexToRgba(highlightColor, 0.2),
          }}
        />
      ) : null}

      <div
        ref={dockRef}
        data-report-mode-ui={true}
        data-testid="report-mode-dock"
        data-corner={position.anchor}
        className="fixed z-[9999] flex w-[min(18rem,92vw)] flex-col gap-1"
        style={dockStyle}
      >
        <div className="flex items-center gap-1 rounded-lg border bg-background p-1.5 shadow-lg">
          <button
            type="button"
            aria-label="Drag to move"
            data-testid="report-mode-drag-handle"
            className="cursor-grab touch-none px-1 text-xs text-muted-foreground active:cursor-grabbing"
            onPointerDown={onDragHandlePointerDown}
          >
            ⠿
          </button>
          <Button
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            data-testid="report-mode-toggle"
            onClick={toggleActive}
          >
            {active ? 'Reporting…' : 'Report'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-expanded={showCorners}
            data-testid="report-mode-corner-menu"
            onClick={() => {
              setShowColors(false);
              setShowCorners((value) => !value);
            }}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-expanded={showColors}
            data-testid="report-mode-highlight-color"
            onClick={() => {
              setShowCorners(false);
              setShowColors((value) => !value);
            }}
          >
            <span
              aria-hidden="true"
              className="mr-1 inline-block size-2.5 rounded-full border border-border"
              style={{ backgroundColor: highlightColor }}
            />
            Color
          </Button>
          {active ? (
            <Button type="button" size="sm" variant="outline" onClick={deactivate}>
              Off
            </Button>
          ) : null}
        </div>

        {showCorners ? (
          <div
            className="flex flex-wrap gap-1 rounded-lg border bg-background p-1.5 shadow-lg"
            data-testid="report-mode-corner-picker"
          >
            {DOCK_CORNER_PRESETS.map((corner) => (
              <Button
                key={corner}
                type="button"
                size="sm"
                variant={position.anchor === corner ? 'default' : 'outline'}
                data-testid={`report-mode-corner-${corner}`}
                onClick={() => {
                  setCorner(corner);
                  setShowCorners(false);
                }}
              >
                {DOCK_CORNER_LABELS[corner]}
              </Button>
            ))}
          </div>
        ) : null}

        {showColors ? (
          <div
            className="flex flex-col gap-2 rounded-lg border bg-background p-1.5 shadow-lg"
            data-testid="report-mode-highlight-color-menu"
          >
            <div className="flex flex-wrap gap-1">
              {INSPECT_HIGHLIGHT_PRESETS.map((preset) => (
                <button
                  aria-label={`Highlight color ${preset}`}
                  aria-pressed={highlightColor === preset}
                  className="size-6 rounded-full border-2 border-border"
                  data-testid={`report-mode-highlight-preset-${preset.slice(1)}`}
                  key={preset}
                  onClick={() => setHighlightColor(preset)}
                  style={{ backgroundColor: preset }}
                  type="button"
                />
              ))}
            </div>
            <label className="flex items-center justify-between gap-2 text-xs">
              <span>Custom</span>
              <input
                aria-label="Custom highlight color"
                className="h-6 w-8 cursor-pointer border-none bg-transparent p-0"
                data-testid="report-mode-highlight-custom"
                onChange={(event) => setHighlightColor(event.target.value)}
                type="color"
                value={highlightColor}
              />
            </label>
            {highlightColor === DEFAULT_INSPECT_HIGHLIGHT_COLOR ? null : (
              <Button
                data-testid="report-mode-highlight-reset"
                onClick={resetHighlightColor}
                size="sm"
                type="button"
                variant="outline"
              >
                Reset
              </Button>
            )}
          </div>
        ) : null}

        {selected ? (
          <ReportModeNotePanel
            copying={copyingSpot}
            note={note}
            onCancel={() => {
              setSelected(null);
              setNote('');
            }}
            onCopySpot={() => void handleCopySpot()}
            onNoteChange={setNote}
            onSubmit={() => void handleSubmit()}
            spotLabel={spotLabel}
            submitting={submitting}
          />
        ) : null}
      </div>
    </>
  );
};
