'use client';

import {
  buildRoundedRectStrokePath,
  HOLD_RECT_COMPACT,
  HOLD_RECT_WIDE,
} from '@/components/report-mode/dock/utils/hold-rect-utils';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ReportHoldOptionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly pending?: boolean;
  readonly progress: number;
  readonly onHoldStart: () => void;
  readonly onHoldCancel: () => void;
  readonly compact?: boolean;
};

const HoldRectProgress = ({
  compact,
  progress,
}: {
  readonly compact: boolean;
  readonly progress: number;
}) => {
  const spec = compact ? HOLD_RECT_COMPACT : HOLD_RECT_WIDE;
  const viewW = spec.width + spec.pad * 2;
  const viewH = spec.height + spec.pad * 2;
  const path = buildRoundedRectStrokePath({
    height: spec.height,
    radius: spec.radius,
    width: spec.width,
    x: spec.pad,
    y: spec.pad,
  });
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <svg
      aria-hidden="true"
      className="report-mode-hold-ring"
      fill="none"
      preserveAspectRatio="none"
      viewBox={`0 0 ${viewW} ${viewH}`}
    >
      <path
        className="report-mode-hold-ring-track"
        d={path}
        pathLength={1}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="report-mode-hold-ring-progress"
        d={path}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - clamped}
        strokeLinecap="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

/**
 * Render a hold-to-select report-mode option.
 *
 * @param props - Button props plus hold state and handlers.
 * @returns A button with an animated rounded progress ring.
 * @example
 * <ReportHoldOption progress={0} onHoldStart={start} onHoldCancel={cancel}>Top left</ReportHoldOption>
 */
const ReportHoldOption = ({
  active = false,
  pending = false,
  progress,
  onHoldStart,
  onHoldCancel,
  compact = false,
  className,
  children,
  onClick,
  ...props
}: ReportHoldOptionProps) => (
  <button
    className={cn(
      'report-mode-hold-option',
      compact && 'report-mode-hold-option--compact',
      active && 'report-mode-hold-option--active',
      pending && 'report-mode-hold-option--pending',
      className,
    )}
    onBlur={onHoldCancel}
    onClick={onClick}
    onFocus={onHoldStart}
    onMouseEnter={onHoldStart}
    onMouseLeave={onHoldCancel}
    type="button"
    {...props}
  >
    <HoldRectProgress compact={compact} progress={pending ? progress : 0} />
    <span className="report-mode-hold-option-content">{children}</span>
  </button>
);

export { ReportHoldOption };
