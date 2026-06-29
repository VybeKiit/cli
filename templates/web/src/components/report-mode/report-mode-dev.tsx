'use client';

import { ReportDockBar } from '@/components/report-mode/dock/components/dock-bar';
import { getBrandChevronDirection } from '@/components/report-mode/dock/utils/report-dock-utils';
import { useReportDockCollapse } from '@/components/report-mode/dock/hooks/use-report-dock-collapse';
import { useReportDockPosition } from '@/components/report-mode/dock/hooks/use-report-dock';
import { useReportHandoffTarget } from '@/components/report-mode/dock/hooks/use-report-handoff-target';
import { useReportInspectHighlightColor } from '@/components/report-mode/dock/hooks/use-report-inspect-highlight-color';
import { ReportModeBanner } from '@/components/report-mode/inspect/report-mode-banner';
import { ReportModeHighlight } from '@/components/report-mode/inspect/report-mode-highlight';
import { ReportModeNotePanel } from '@/components/report-mode/inspect/report-mode-note-panel';
import { useInspectMode } from '@/components/report-mode/inspect/use-inspect-mode';
import { useReportHotkey } from '@/components/report-mode/inspect/use-report-hotkey';
import { useConsoleErrorBuffer } from '@/components/report-mode/shared/use-console-errors';
import { ReportModeTutorial } from '@/components/report-mode/tutorial/report-mode-tutorial';
import { useReportTutorial } from '@/components/report-mode/tutorial/use-report-tutorial';
import {
  getAccessibleName,
  getCssPath,
  getShortestUniqueLabel,
  getVisibleText,
} from '@/lib/report-mode/dom-utils';
import { submitReportHandoff } from '@/lib/report-mode/submit-report';
import { cn } from '@/lib/utils';
import {
  getDockPlacementStyle,
  snapDockToNearestCorner,
  type VybeAssistant,
} from '@vybekiit/report-mode';
import { usePathname } from '@/i18n/navigation';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';

type ReportModeDevProps = {
  readonly assistant: VybeAssistant | null;
  readonly projectRoot: string;
};

/** Dev-only Report Mode — click-to-report with structured assistant handoff. */
export function ReportModeDev({ assistant, projectRoot }: ReportModeDevProps) {
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

  useEffect(() => {
    if (tutorial.active && tutorial.stepIndex === 2 && !inspectActive) {
      activateInspect();
    }
  }, [tutorial.active, tutorial.stepIndex, inspectActive, activateInspect]);

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

  async function handleCopySpot() {
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
  }

  async function handleSubmit() {
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
  }

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
          !collapse.pinnedExpanded && !collapse.dockHovered && 'report-mode-dock-root--collapsed',
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
}
