'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  buildRoundedRectStrokePath,
  HOLD_RECT_COMPACT,
  HOLD_RECT_WIDE,
} from '@/components/report-mode/dock/utils/hold-rect-utils';
import { cn } from '@/lib/utils';

type ReportHoldOptionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly pending?: boolean;
  readonly progress: number;
  readonly onHoldStart: () => void;
  readonly onHoldCancel: () => void;
  readonly compact?: boolean;
};

function HoldRectProgress({
  compact,
  progress,
}: {
  readonly compact: boolean;
  readonly progress: number;
}) {
  const spec = compact ? HOLD_RECT_COMPACT : HOLD_RECT_WIDE;
  const viewW = spec.width + spec.pad * 2;
  const viewH = spec.height + spec.pad * 2;
  const path = buildRoundedRectStrokePath(spec.pad, spec.pad, spec.width, spec.height, spec.radius);
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
}

/** Option button — hold 2s for rounded border to complete, then selection applies. */
export function ReportHoldOption({
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
}: ReportHoldOptionProps) {
  return (
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
}
