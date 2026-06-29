'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConsoleErrorBuffer } from '@/components/report-mode/use-console-errors';
import { useReportDockPosition } from '@/components/report-mode/use-report-dock';
import { getAccessibleName, getCssPath, getVisibleText } from '@/lib/report-mode/dom-utils';
import { submitReportHandoff } from '@/lib/report-mode/submit-report';
import {
  DOCK_CORNER_LABELS,
  DOCK_CORNER_PRESETS,
  REPORT_MODE_HOTKEY_LABEL,
  getDockPlacementStyle,
  snapDockToNearestCorner,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import { usePathname } from '@/i18n/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

type ReportModeDevProps = {
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
};

function isReportHotkey(event: KeyboardEvent): boolean {
  return event.altKey && event.shiftKey && event.key.toLowerCase() === 'r';
}

/**
 * Dev-only Report Mode — persistent dock (drag or corner presets), click-to-report,
 * plain-language prompts only (no DOM jargon for the builder).
 */
export function ReportModeDev({ assistant, projectRoot }: ReportModeDevProps) {
  const pathname = usePathname();
  const errorBuffer = useConsoleErrorBuffer();
  const { position, savePosition, setCorner } = useReportDockPosition();
  const dockRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [selected, setSelected] = useState<Element | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showCorners, setShowCorners] = useState(false);

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
    function onKeyDown(event: KeyboardEvent) {
      if (!isReportHotkey(event)) {
        return;
      }
      event.preventDefault();
      toggleActive();
    }
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
    function onPointerMove(event: PointerEvent) {
      const x = event.clientX - dragOffset.current.x;
      const y = event.clientY - dragOffset.current.y;
      savePosition({ anchor: 'custom', customX: Math.max(0, x), customY: Math.max(0, y) });
    }
    function onPointerUp(event: PointerEvent) {
      setDragging(false);
      const snapped = snapDockToNearestCorner(
        event.clientX - dragOffset.current.x,
        event.clientY - dragOffset.current.y,
        window.innerWidth,
        window.innerHeight,
      );
      savePosition(snapped);
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragging, savePosition]);

  function onDragHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const rect = dockRef.current?.getBoundingClientRect();
    const left = rect?.left ?? event.clientX;
    const top = rect?.top ?? event.clientY;
    dragOffset.current = { x: event.clientX - left, y: event.clientY - top };
    setDragging(true);
  }

  async function handleSubmit() {
    if (!(selected && note.trim())) {
      return;
    }
    setSubmitting(true);
    try {
      const a11yName = getAccessibleName(selected);
      const visibleText = getVisibleText(selected);
      await submitReportHandoff({
        assistant,
        projectRoot,
        payload: {
          route: pathname,
          selector: getCssPath(selected),
          ...(a11yName === undefined ? {} : { a11yName }),
          ...(visibleText === undefined ? {} : { visibleText }),
          consoleErrors: errorBuffer.snapshot(),
          builderNote: note.trim(),
          platform: 'web',
        },
      });
      deactivate();
    } finally {
      setSubmitting(false);
    }
  }

  const highlightTarget = selected ?? hovered;
  const highlightRect =
    highlightTarget && typeof highlightTarget.getBoundingClientRect === 'function'
      ? highlightTarget.getBoundingClientRect()
      : null;

  const dockStyle = getDockPlacementStyle(position) as CSSProperties;

  return (
    <>
      {active ? (
        <div
          data-report-mode-ui={true}
          data-testid="report-mode-banner"
          className="pointer-events-none fixed inset-x-0 top-0 z-[9998] bg-amber-500/90 px-4 py-2 text-center text-sm font-medium text-amber-950"
        >
          Click what looks wrong ({REPORT_MODE_HOTKEY_LABEL} to turn off)
        </div>
      ) : null}

      {active && highlightRect ? (
        <div
          data-report-mode-ui={true}
          className="pointer-events-none fixed z-[9997] rounded border-2 border-amber-500 bg-amber-400/20"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      ) : null}

      <div
        ref={dockRef}
        data-report-mode-ui={true}
        data-testid="report-mode-dock"
        data-corner={position.anchor}
        className="fixed z-[9999] flex w-[min(92vw,28rem)] flex-col gap-2"
        style={dockStyle}
      >
        <div className="flex items-center gap-1 rounded-lg border bg-background p-2 shadow-lg">
          <button
            type="button"
            aria-label="Drag to move"
            data-testid="report-mode-drag-handle"
            className="cursor-grab touch-none px-1 text-muted-foreground active:cursor-grabbing"
            onPointerDown={onDragHandlePointerDown}
          >
            ⠿
          </button>
          <Button
            type="button"
            size="sm"
            variant={active ? 'default' : 'secondary'}
            data-testid="report-mode-toggle"
            onClick={toggleActive}
          >
            {active ? 'Reporting…' : 'Report'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={showCorners}
            data-testid="report-mode-corner-menu"
            onClick={() => setShowCorners((value) => !value)}
          >
            Pin
          </Button>
          {active ? (
            <Button type="button" size="sm" variant="ghost" onClick={deactivate}>
              Off
            </Button>
          ) : null}
        </div>

        {showCorners ? (
          <div
            className="flex flex-wrap gap-1 rounded-lg border bg-background p-2 shadow-lg"
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

        {selected ? (
          <div
            data-testid="report-mode-note-panel"
            className="rounded-lg border bg-background p-4 shadow-lg"
          >
            <p className="mb-2 text-sm font-medium">What looks wrong here?</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                autoFocus={true}
                data-testid="report-mode-note-input"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. this button does nothing"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSubmit();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  data-testid="report-mode-send"
                  disabled={submitting || !note.trim()}
                  onClick={() => void handleSubmit()}
                >
                  Send
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelected(null);
                    setNote('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
