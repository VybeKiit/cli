'use client';

import {
  getDockPlacementStyle,
  snapDockToNearestCorner,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import {
  useConsoleErrorBuffer,
  useInspectMode,
  useReportDockCollapse,
  useReportDockPosition,
  useReportHandoffTarget,
  useReportHotkey,
  useReportInspectHighlightColor,
  useReportTutorial,
} from '@vybekiit/report-mode/web';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ReportDockBar } from '@/components/report-mode/dock/components/DockBar';
import { getBrandChevronDirection } from '@/components/report-mode/dock/utils/report-dock-utils';
import { ReportModeBanner } from '@/components/report-mode/inspect/ReportModeBanner';
import { ReportModeHighlight } from '@/components/report-mode/inspect/ReportModeHighlight';
import { ReportModeNotePanel } from '@/components/report-mode/inspect/ReportModeNotePanel';
import { ReportModeTutorial } from '@/components/report-mode/tutorial/ReportModeTutorial';
import {
  getAccessibleName,
  getCssPath,
  getShortestUniqueLabel,
  getVisibleText,
} from '@/lib/report-mode/domUtils';
import { submitReportHandoff } from '@/lib/report-mode/submitReport';
import { cn } from '@/lib/utils';

interface ReportModeDevProps {
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
}

/**
 * Render dev-only Report Mode with click-to-report assistant handoff.
 *
 * @param props - Assistant configuration and project root for generated handoffs.
 * @returns Report Mode dock, highlight overlay, and note panel.
 * @example
 * <ReportModeDev assistant={assistant} projectRoot="/repo" />
 */
const ReportModeDev = ({ assistant, projectRoot }: ReportModeDevProps) => {
  const pathname = usePathname();
  const errorBuffer = useConsoleErrorBuffer();
  const { target: handoffTarget, setTarget: setHandoffTarget } = useReportHandoffTarget();
  const {
    color: highlightColor,
    setColor: setHighlightColor,
    resetColor: resetHighlightColor,
  } = useReportInspectHighlightColor();
  const { position, savePosition, setCorner } = useReportDockPosition();
  const collapse = useReportDockCollapse();
  const tutorial = useReportTutorial();
  const inspect = useInspectMode();
  const {
    active: inspectActive,
    activate: activateInspect,
    selected: inspectSelected,
    note: inspectNote,
    setNote: setInspectNote,
    highlightRect,
    deactivate: deactivateInspect,
    toggleActive: toggleInspectActive,
    clearSelection: clearInspectSelection,
  } = inspect;
  const dockRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [copyingSpot, setCopyingSpot] = useState(false);
  const [dragging, setDragging] = useState(false);

  const spotLabel = useMemo(
    () => (inspectSelected ? getShortestUniqueLabel(inspectSelected) : ''),
    [inspectSelected],
  );

  useReportHotkey(toggleInspectActive);

  // Escape backs out of pick mode one step: clear a selected element first, else exit + toast.
  useEffect(() => {
    if (!inspectActive) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      if (inspectSelected) {
        clearInspectSelection();
        return;
      }
      deactivateInspect();
      toast('Point & fix cancelled');
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [inspectActive, inspectSelected, clearInspectSelection, deactivateInspect]);

  useEffect(() => {
    if (tutorial.active && tutorial.stepIndex === 2 && !inspectActive) {
      activateInspect();
    }
  }, [tutorial.active, tutorial.stepIndex, inspectActive, activateInspect]);

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
        viewportWidth: globalThis.innerWidth,
        viewportHeight: globalThis.innerHeight,
      });
      savePosition(snapped);
    };
    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', onPointerUp);
    return () => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', onPointerUp);
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
      toast.success('Copied spot');
    } catch {
      toast.error('Could not copy spot');
    } finally {
      setCopyingSpot(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!(inspectSelected && inspectNote.trim())) {
      return;
    }
    setSubmitting(true);
    try {
      const a11yName = getAccessibleName(inspectSelected);
      const visibleText = getVisibleText(inspectSelected);
      await submitReportHandoff({
        assistant,
        projectRoot,
        target: handoffTarget,
        payload: {
          route: pathname,
          selector: getCssPath(inspectSelected),
          spotLabel,
          ...(a11yName === undefined ? {} : { a11yName }),
          ...(visibleText === undefined ? {} : { visibleText }),
          consoleErrors: errorBuffer.snapshot(),
          builderNote: inspectNote.trim(),
          platform: 'web',
        },
      });
      deactivateInspect();
    } finally {
      setSubmitting(false);
    }
  };

  const dockStyle = getDockPlacementStyle(position) as CSSProperties;
  const tutorialActive = tutorial.active;
  const showControls = collapse.isExpanded;
  const chevronDirection = getBrandChevronDirection(
    position.anchor,
    position.customX,
    showControls,
  );

  return (
    <>
      {inspectActive ? <ReportModeBanner /> : null}
      {inspectActive && highlightRect ? (
        <ReportModeHighlight color={highlightColor} rect={highlightRect} />
      ) : null}

      <ReportModeTutorial
        active={tutorialActive}
        onComplete={tutorial.complete}
        onNext={() => tutorial.next(4)}
        onSkip={tutorial.skip}
        stepIndex={tutorial.stepIndex}
      />

      <div
        className={cn(
          'report-mode-dock-root fixed z-[9999] flex flex-col gap-2',
          !(collapse.pinnedExpanded || collapse.dockHovered) && 'report-mode-dock-root--collapsed',
          collapse.pinnedExpanded && 'report-mode-dock-root--pinned',
        )}
        data-corner={position.anchor}
        data-report-mode-ui={true}
        data-report-tutorial="welcome"
        data-testid="report-mode-dock"
        onMouseEnter={collapse.onDockEnter}
        onMouseLeave={collapse.onDockLeave}
        ref={dockRef}
        style={dockStyle}
      >
        <ReportDockBar
          active={inspectActive}
          anchor={position.anchor}
          assistant={assistant}
          chevronDirection={chevronDirection}
          handoffTarget={handoffTarget}
          highlightColor={highlightColor}
          onDeactivate={deactivateInspect}
          onDragPointerDown={onDragHandlePointerDown}
          onHandoffChange={setHandoffTarget}
          onHighlightColorChange={setHighlightColor}
          onHighlightColorReset={resetHighlightColor}
          onSetCorner={setCorner}
          onToggleActive={toggleInspectActive}
          onToggleExpanded={collapse.toggleExpanded}
          showControls={showControls}
          tutorialActive={tutorialActive}
        />

        {inspectSelected ? (
          <ReportModeNotePanel
            copying={copyingSpot}
            note={inspectNote}
            onCancel={clearInspectSelection}
            onCopySpot={() => void handleCopySpot()}
            onNoteChange={setInspectNote}
            onSubmit={() => void handleSubmit()}
            spotLabel={spotLabel}
            submitting={submitting}
          />
        ) : null}
      </div>
    </>
  );
};

export { ReportModeDev };
