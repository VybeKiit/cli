'use client';

import { ReportControlHint } from '@/components/report-mode/shared/report-control-hint';
import { REPORT_DOCK_TOOLTIPS } from '@/components/report-mode/shared/report-mode-copy';
import {
  ReportBrandChevronIcon,
  ReportVybeMarkIcon,
} from '@/components/report-mode/shared/report-mode-icons';
import { cn } from '@/lib/utils';

interface ReportModeBrandChipProps {
  readonly expanded: boolean;
  readonly chevronDirection: 'left' | 'right';
  readonly onToggle: () => void;
  readonly tutorialActive?: boolean;
}

/**
 * Brand chip — VybeKiit mark + wordmark + expand/collapse chevron.
 *
 * @param props - Component props.
 * @returns The rendered ReportModeBrandChip element.
 * @example
 * ```tsx
 * <ReportModeBrandChip />
 * ```
 */

export const ReportModeBrandChip = ({
  expanded,
  chevronDirection,
  onToggle,
  tutorialActive = false,
}: ReportModeBrandChipProps) => (
  <ReportControlHint disabled={tutorialActive} text={REPORT_DOCK_TOOLTIPS.brandChip}>
    <button
      aria-expanded={expanded}
      aria-label={expanded ? 'Collapse feedback bar' : 'Expand feedback bar'}
      className={cn('report-mode-brand-chip', expanded && 'report-mode-brand-chip--expanded')}
      data-report-tutorial="welcome"
      data-testid="report-mode-brand-toggle"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      type="button"
    >
      <ReportVybeMarkIcon />
      <span className="report-mode-brand-wordmark">VybeKiit</span>
      <ReportBrandChevronIcon direction={chevronDirection} />
    </button>
  </ReportControlHint>
);
