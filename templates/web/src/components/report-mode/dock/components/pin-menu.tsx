'use client';

import { ReportFlyoutPortal } from '@/components/report-mode/dock/components/report-flyout-portal';
import { ReportHoldOption } from '@/components/report-mode/dock/components/hold-option';
import { useReportFlyoutPosition } from '@/components/report-mode/dock/hooks/use-report-flyout-position';
import { useReportHoldSelect } from '@/components/report-mode/dock/hooks/use-report-hold-select';
import { useReportHoverMenu } from '@/components/report-mode/dock/hooks/use-report-hover-menu';
import { CornerAnchorIcon, ReportPinIcon } from '@/components/report-mode/shared/report-mode-icons';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { cn } from '@/lib/utils';
import {
  DOCK_CORNER_LABELS,
  DOCK_CORNER_PRESETS,
  type ReportDockAnchor,
} from '@vybekiit/report-mode';
import { useRef } from 'react';

type ReportPinMenuProps = {
  readonly anchor: ReportDockAnchor;
  readonly onSelect: (corner: Exclude<ReportDockAnchor, 'custom'>) => void;
  readonly tutorialActive?: boolean;
};

/** Pin control — hover to reveal corners, hold 2s on a corner to snap the dock. */
export function ReportPinMenu({ anchor, onSelect, tutorialActive = false }: ReportPinMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, openMenu, scheduleClose, closeMenu } = useReportHoverMenu();
  const flyoutStyle = useReportFlyoutPosition(open, triggerRef, 'center');
  const { pending, progress, startHold, cancelHold } = useReportHoldSelect<
    Exclude<ReportDockAnchor, 'custom'>
  >((corner) => {
    onSelect(corner);
    closeMenu();
  });

  return (
    <div
      className={cn('report-mode-pin', open && 'report-mode-pin--open')}
      data-report-mode-control={true}
      onMouseEnter={openMenu}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      <ReportControlHint
        disabled={open || pending !== null || tutorialActive}
        text={REPORT_DOCK_TOOLTIPS.position}
      >
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Pin dock position"
          className="report-mode-dock-btn report-mode-dock-btn--pin"
          data-testid="report-mode-corner-menu"
          ref={triggerRef}
          type="button"
        >
          <ReportPinIcon />
          <span className="report-mode-dock-btn-label">Position</span>
        </button>
      </ReportControlHint>

      <ReportFlyoutPortal
        className="report-mode-corner-picker"
        data-testid="report-mode-corner-picker"
        onMouseEnter={openMenu}
        onMouseLeave={() => {
          cancelHold();
          scheduleClose();
        }}
        open={open}
        role="menu"
        style={flyoutStyle}
      >
        {DOCK_CORNER_PRESETS.map((corner) => (
          <ReportHoldOption
            aria-label={`Pin to ${DOCK_CORNER_LABELS[corner]}`}
            active={anchor === corner}
            className={cn(
              'report-mode-corner-hold-option',
              anchor === corner && 'report-mode-corner-hold-option--anchor',
            )}
            compact={true}
            data-testid={`report-mode-corner-${corner}`}
            key={corner}
            onHoldCancel={cancelHold}
            onHoldStart={() => startHold(corner)}
            pending={pending === corner}
            progress={pending === corner ? progress : 0}
            role="menuitem"
          >
            <CornerAnchorIcon beaming={open} corner={corner} />
          </ReportHoldOption>
        ))}
      </ReportFlyoutPortal>
    </div>
  );
}
