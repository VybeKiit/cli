'use client';

import { REPORT_HANDOFF_TARGET_LABELS, type ReportHandoffTarget } from '@vybekiit/report-mode';
import {
  useReportFlyoutPosition,
  useReportHoldSelect,
  useReportHoverMenu,
} from '@vybekiit/report-mode/web';
import { useRef } from 'react';
import { ReportHoldOption } from '@/components/report-mode/dock/components/hold-option';
import { ReportFlyoutPortal } from '@/components/report-mode/dock/components/report-flyout-portal';
import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import { ReportChatHandoffIcon } from '@/components/report-mode/shared/report-mode-icons';
import { cn } from '@/lib/utils';

const HANDOFF_OPTIONS: readonly ReportHandoffTarget[] = ['current-chat', 'new-chat'];

const HANDOFF_OPTION_TOOLTIPS: Record<ReportHandoffTarget, string> = {
  'current-chat': REPORT_DOCK_TOOLTIPS.handoffCurrentChat,
  'new-chat': REPORT_DOCK_TOOLTIPS.handoffNewChat,
};

interface ReportHandoffMenuProps {
  readonly value: ReportHandoffTarget;
  readonly onChange: (target: ReportHandoffTarget) => void;
  readonly tutorialActive?: boolean;
}

/** Hover menu — hold 2s on an option to lock chat handoff target. */
export function ReportHandoffMenu({
  value,
  onChange,
  tutorialActive = false,
}: ReportHandoffMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const { open, openMenu, scheduleClose, closeMenu } = useReportHoverMenu();
  const flyoutStyle = useReportFlyoutPosition(open, triggerRef, 'end', flyoutRef);
  const { pending, progress, startHold, cancelHold } = useReportHoldSelect<ReportHandoffTarget>(
    (target) => {
      onChange(target);
      closeMenu();
    },
  );

  return (
    <div
      className={cn('report-mode-handoff', open && 'report-mode-handoff--open')}
      data-report-mode-control={true}
      onMouseEnter={openMenu}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      <ReportControlHint
        disabled={open || pending !== null || tutorialActive}
        text={REPORT_DOCK_TOOLTIPS.handoffTrigger}
      >
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Send to: ${REPORT_HANDOFF_TARGET_LABELS[value]}`}
          className="report-mode-dock-btn report-mode-dock-btn--handoff"
          data-testid="report-mode-handoff-target"
          ref={triggerRef}
          type="button"
        >
          <ReportChatHandoffIcon target={value} />
          <span className="report-mode-handoff-label">{REPORT_HANDOFF_TARGET_LABELS[value]}</span>
          <svg
            aria-hidden="true"
            className="report-mode-handoff-chevron"
            fill="none"
            viewBox="0 0 12 12"
          >
            <path
              d="M3 4.5 L6 7.5 L9 4.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.4"
            />
          </svg>
        </button>
      </ReportControlHint>

      <ReportFlyoutPortal
        aria-label="Send report to"
        className="report-mode-handoff-menu"
        data-testid="report-mode-handoff-menu"
        onMouseEnter={openMenu}
        onMouseLeave={() => {
          cancelHold();
          scheduleClose();
        }}
        open={open}
        ref={flyoutRef}
        role="listbox"
        style={flyoutStyle}
      >
        {HANDOFF_OPTIONS.map((option) => (
          <ReportControlHint
            disabled={pending !== null}
            key={option}
            text={HANDOFF_OPTION_TOOLTIPS[option]}
          >
            <ReportHoldOption
              aria-selected={value === option}
              active={value === option}
              className="report-mode-handoff-option"
              data-testid={`report-mode-handoff-${option}`}
              onHoldCancel={cancelHold}
              onHoldStart={() => startHold(option)}
              pending={pending === option}
              progress={pending === option ? progress : 0}
              role="option"
            >
              <ReportChatHandoffIcon target={option} />
              <span>{REPORT_HANDOFF_TARGET_LABELS[option]}</span>
            </ReportHoldOption>
          </ReportControlHint>
        ))}
      </ReportFlyoutPortal>
    </div>
  );
}
