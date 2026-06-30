'use client';

import { ReportFlyoutPortal } from '@/components/report-mode/dock/components/report-flyout-portal';
import { useReportFlyoutPosition } from '@/components/report-mode/dock/hooks/use-report-flyout-position';
import { useReportHoverMenu } from '@/components/report-mode/dock/hooks/use-report-hover-menu';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { cn } from '@/lib/utils';
import { DEFAULT_INSPECT_HIGHLIGHT_COLOR, INSPECT_HIGHLIGHT_PRESETS } from '@vybekiit/report-mode';
import { useRef } from 'react';

interface ReportHighlightColorMenuProps {
  readonly color: string;
  readonly onChange: (color: string) => void;
  readonly onReset: () => void;
  readonly tutorialActive?: boolean;
}

/** Hover menu — click a preset or use the color picker to change the inspect highlight ring. */
export function ReportHighlightColorMenu({
  color,
  onChange,
  onReset,
  tutorialActive = false,
}: ReportHighlightColorMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, openMenu, scheduleClose, closeMenu } = useReportHoverMenu();
  const flyoutStyle = useReportFlyoutPosition(open, triggerRef, 'center');

  return (
    <div
      className={cn('report-mode-highlight-color', open && 'report-mode-highlight-color--open')}
      data-report-mode-control={true}
      onMouseEnter={openMenu}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      <ReportControlHint
        disabled={open || tutorialActive}
        text={REPORT_DOCK_TOOLTIPS.highlightColor}
      >
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Inspect highlight color"
          className="report-mode-dock-btn report-mode-dock-btn--highlight-color"
          data-testid="report-mode-highlight-color"
          ref={triggerRef}
          type="button"
        >
          <span
            aria-hidden="true"
            className="report-mode-highlight-swatch"
            style={{ backgroundColor: color }}
          />
          <span className="report-mode-dock-btn-label">Highlight</span>
        </button>
      </ReportControlHint>

      <ReportFlyoutPortal
        aria-label="Inspect highlight color"
        className="report-mode-highlight-color-menu"
        data-testid="report-mode-highlight-color-menu"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        open={open}
        role="dialog"
        style={flyoutStyle}
      >
        <div className="report-mode-highlight-presets">
          {INSPECT_HIGHLIGHT_PRESETS.map((preset) => (
            <button
              aria-label={`Highlight color ${preset}`}
              aria-pressed={color === preset}
              className={cn(
                'report-mode-highlight-preset',
                color === preset && 'report-mode-highlight-preset--active',
              )}
              data-testid={`report-mode-highlight-preset-${preset.slice(1)}`}
              key={preset}
              onClick={() => {
                onChange(preset);
                closeMenu();
              }}
              style={{ backgroundColor: preset }}
              type="button"
            />
          ))}
        </div>

        <label className="report-mode-highlight-custom">
          <span className="report-mode-highlight-custom-label">Custom</span>
          <input
            aria-label="Custom highlight color"
            className="report-mode-highlight-custom-input"
            data-testid="report-mode-highlight-custom"
            onChange={(event) => onChange(event.target.value)}
            type="color"
            value={color}
          />
        </label>

        {color === DEFAULT_INSPECT_HIGHLIGHT_COLOR ? null : (
          <button
            className="report-mode-highlight-reset"
            data-testid="report-mode-highlight-reset"
            onClick={() => {
              onReset();
              closeMenu();
            }}
            type="button"
          >
            Reset
          </button>
        )}
      </ReportFlyoutPortal>
    </div>
  );
}
