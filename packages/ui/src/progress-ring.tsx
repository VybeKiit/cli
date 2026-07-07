'use client';

import { cn } from './utils';

interface ProgressRingProps {
  readonly value: number;
  readonly max?: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly color?: string;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Circular progress ring with animated fill.
 *
 * @param props - Progress value, max, dimensions, stroke, color, label, and classes.
 * @returns An SVG-backed circular progress indicator.
 * @example
 * <ProgressRing value={75} label="75%" />;
 */
export const ProgressRing = (props: ProgressRingProps) => {
  const {
    value,
    max = 100,
    size = 64,
    strokeWidth = 4,
    color = '#7c3aed',
    label,
    className = '',
  } = props;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
      </svg>
      {label && <span className="absolute text-xs font-bold text-zinc-200">{label}</span>}
    </div>
  );
};
