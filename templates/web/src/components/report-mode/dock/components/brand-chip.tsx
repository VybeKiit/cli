'use client';

import {
  ReportBrandChevronIcon,
  ReportVybeMarkIcon,
} from '@/components/report-mode/shared/report-mode-icons';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { cn } from '@/lib/utils';
import { useCallback, type MouseEvent } from 'react';

interface ReportModeBrandChipProps {
  readonly expanded: boolean;
  readonly chevronDirection: 'left' | 'right';
  readonly onToggle: () => void;
  readonly tutorialActive?: boolean;
}

/**
 * Brand chip with VybeKiit mark, wordmark, and expand/collapse chevron.
 *
 * @returns Toggle button for the report mode dock.
 * @example
 * <ReportModeBrandChip expanded={false} chevronDirection="right" onToggle={() => {}} />;
 */
export const ReportModeBrandChip = ({
  expanded,
  chevronDirection,
  onToggle,
  tutorialActive = false,
}: ReportModeBrandChipProps) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  return (
    <ReportControlHint disabled={tutorialActive} text={REPORT_DOCK_TOOLTIPS.brandChip}>
      <button
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse feedback bar' : 'Expand feedback bar'}
        className={cn('report-mode-brand-chip', expanded && 'report-mode-brand-chip--expanded')}
        data-report-tutorial="welcome"
        data-testid="report-mode-brand-toggle"
        onClick={handleClick}
        type="button"
      >
        <ReportVybeMarkIcon />
        <span className="report-mode-brand-wordmark">VybeKiit</span>
        <ReportBrandChevronIcon direction={chevronDirection} />
      </button>
    </ReportControlHint>
  );
};
