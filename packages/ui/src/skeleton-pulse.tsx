'use client';

import { cn } from './utils';

interface SkeletonPulseProps {
  readonly width?: string;
  readonly height?: string;
  readonly rounded?: 'sm' | 'md' | 'lg' | 'full';
  readonly className?: string;
}

/**
 * Skeleton loading placeholder with shimmer animation.
 *
 * @param props - Placeholder width, height, radius preset, and classes.
 * @returns A single shimmer skeleton block.
 * @example
 * <SkeletonPulse width="60%" height="16px" />;
 */
export const SkeletonPulse = (props: SkeletonPulseProps) => {
  const { width = '100%', height = '20px', rounded = 'md', className = '' } = props;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-zinc-800/50',
        rounded === 'sm' && 'rounded',
        rounded === 'md' && 'rounded-lg',
        rounded === 'lg' && 'rounded-xl',
        rounded === 'full' && 'rounded-full',
        className,
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
    </div>
  );
};

interface SkeletonGroupProps {
  readonly lines?: number;
  readonly className?: string;
}

/**
 * Render a preset group of skeleton rows for message/content loading.
 *
 * @param props - Row count and optional wrapper classes.
 * @returns Skeleton rows with stable keys and a shorter final line.
 * @example
 * <SkeletonGroup lines={4} />;
 */
export const SkeletonGroup = ({ lines = 3, className }: SkeletonGroupProps) => {
  const rowKeys = Array.from({ length: lines }, (_, rowIndex) => `skeleton-row-${rowIndex + 1}`);

  return (
    <div className={cn('space-y-2', className)}>
      {rowKeys.map((rowKey, rowIndex) => (
        <SkeletonPulse key={rowKey} width={rowIndex === lines - 1 ? '60%' : '90%'} height="14px" />
      ))}
    </div>
  );
};
