'use client';

import { cn } from './utils';

type PulseBeamProps = {
  color?: 'green' | 'orange' | 'red' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const COLOR_MAP = {
  green: { dot: 'bg-emerald-500', ring: 'bg-emerald-500/30', shadow: '0 0 8px #22c55e88' },
  orange: { dot: 'bg-orange-500', ring: 'bg-orange-500/30', shadow: '0 0 8px #f9731688' },
  red: { dot: 'bg-red-500', ring: 'bg-red-500/30', shadow: '0 0 8px #ef444488' },
  blue: { dot: 'bg-blue-500', ring: 'bg-blue-500/30', shadow: '0 0 8px #3b82f688' },
  purple: { dot: 'bg-purple-500', ring: 'bg-purple-500/30', shadow: '0 0 8px #7c3aed88' },
};

const SIZE_MAP = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4' };

/**
 * Animated pulsing dot with expanding ring beacon.
 * Use for live status, connection indicators, or step progress.
 */
export const PulseBeam = ({ color = 'green', size = 'md', className }: PulseBeamProps) => {
  const c = COLOR_MAP[color];
  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'animate-ping absolute inline-flex rounded-full opacity-75',
          c.ring,
          SIZE_MAP[size],
        )}
      />
      <span
        className={cn('relative inline-flex rounded-full', c.dot, SIZE_MAP[size])}
        style={{ boxShadow: c.shadow }}
      />
    </span>
  );
};
