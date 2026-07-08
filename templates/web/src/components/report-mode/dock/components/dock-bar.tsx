'use client';

import { ReportModeBrandChip } from '@/components/report-mode/dock/components/brand-chip';
import { ReportHandoffMenu } from '@/components/report-mode/dock/components/handoff-menu';
import { ReportHighlightColorMenu } from '@/components/report-mode/dock/components/highlight-color-menu';
import { ReportPinMenu } from '@/components/report-mode/dock/components/pin-menu';
import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import {
  ReportDragIcon,
  ReportTargetIcon,
} from '@/components/report-mode/shared/report-mode-icons';
import { cn } from '@/lib/utils';
import type { ReportDockAnchor, ReportHandoffTarget, VybeAssistant } from '@vybekiit/report-mode';

interface ReportDockBarProps {
  readonly showControls: boolean;
  readonly chevronDirection: 'left' | 'right';
  readonly tutorialActive: boolean;
  readonly active: boolean;
  readonly assistant: VybeAssistant | null;
  readonly anchor: ReportDockAnchor;
  readonly handoffTarget: ReportHandoffTarget;
  readonly highlightColor: string;
  readonly onHighlightColorChange: (color: string) => void;
  readonly onHighlightColorReset: () => void;
  readonly onToggleExpanded: () => void;
  readonly onToggleActive: () => void;
  readonly onDeactivate: () => void;
  readonly onSetCorner: (corner: Exclude<ReportDockAnchor, 'custom'>) => void;
  readonly onHandoffChange: (target: ReportHandoffTarget) => void;
  readonly onDragPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}

/**
 * Render the collapsible feedback toolbar.
 *
 * @param props - Current dock state and interaction callbacks.
 * @returns Report Mode dock controls.
 * @example
 * <ReportDockBar showControls={true} chevronDirection="left" tutorialActive={false} active={false} assistant={null} anchor="bottom-right" handoffTarget="current-chat" highlightColor="#3b82f6" onHighlightColorChange={setColor} onHighlightColorReset={resetColor} onToggleExpanded={toggleExpanded} onToggleActive={toggleActive} onDeactivate={deactivate} onSetCorner={setCorner} onHandoffChange={setHandoff} onDragPointerDown={startDrag} />
 */
const ReportDockBar = ({
  showControls,
  chevronDirection,
  tutorialActive,
  active,
  assistant,
  anchor,
  handoffTarget,
  highlightColor,
  onHighlightColorChange,
  onHighlightColorReset,
  onToggleExpanded,
  onToggleActive,
  onDeactivate,
  onSetCorner,
  onHandoffChange,
  onDragPointerDown,
}: ReportDockBarProps) => (
  <div
    className={cn(
      'report-mode-dock-bar',
      showControls ? 'report-mode-dock-bar--expanded' : 'report-mode-dock-bar--collapsed',
    )}
  >
    <ReportModeBrandChip
      chevronDirection={chevronDirection}
      expanded={showControls}
      onToggle={onToggleExpanded}
      tutorialActive={tutorialActive}
    />

    <div
      className={cn(
        'report-mode-dock-controls',
        showControls && 'report-mode-dock-controls--visible',
      )}
    >
      <ReportControlHint
        disabled={tutorialActive}
        text={active ? REPORT_DOCK_TOOLTIPS.pointAndFixActive : REPORT_DOCK_TOOLTIPS.pointAndFix}
      >
        <button
          aria-label={active ? 'Stop pick mode' : 'Point and fix'}
          aria-pressed={active}
          className={cn(
            'report-mode-dock-btn report-mode-dock-btn--report',
            active && 'report-mode-dock-btn--report-active',
          )}
          data-report-mode-control={true}
          data-report-tutorial="report"
          data-testid="report-mode-toggle"
          onClick={onToggleActive}
          type="button"
        >
          <ReportTargetIcon active={active} />
          <span className="report-mode-dock-btn-label">{active ? 'On' : 'Point & fix'}</span>
        </button>
      </ReportControlHint>

      <div className="report-mode-settings-group" data-report-tutorial="settings">
        <ReportPinMenu anchor={anchor} onSelect={onSetCorner} tutorialActive={tutorialActive} />

        <ReportHighlightColorMenu
          color={highlightColor}
          onChange={onHighlightColorChange}
          onReset={onHighlightColorReset}
          tutorialActive={tutorialActive}
        />

        {assistant ? (
          <ReportHandoffMenu
            onChange={onHandoffChange}
            tutorialActive={tutorialActive}
            value={handoffTarget}
          />
        ) : null}
      </div>

      <ReportControlHint disabled={tutorialActive} text={REPORT_DOCK_TOOLTIPS.drag}>
        <button
          aria-label="Drag to move"
          className="report-mode-dock-btn report-mode-dock-btn--drag"
          data-report-mode-control={true}
          data-testid="report-mode-drag-handle"
          onPointerDown={onDragPointerDown}
          type="button"
        >
          <ReportDragIcon />
        </button>
      </ReportControlHint>

      {active ? (
        <ReportControlHint disabled={tutorialActive} text={REPORT_DOCK_TOOLTIPS.off}>
          <button
            aria-label="Turn off pick mode"
            className="report-mode-dock-btn"
            data-report-mode-control={true}
            onClick={onDeactivate}
            type="button"
          >
            Off
          </button>
        </ReportControlHint>
      ) : null}
    </div>
  </div>
);

export { ReportDockBar };
