'use client';

import { cn } from './utils';

type SkeletonPulseProps = {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
};

/** Skeleton loading placeholder with shimmer animation. Extends the base Skeleton. */
export const SkeletonPulse = ({
  width = '100%',
  height = '20px',
  rounded = 'md',
  className,
}: SkeletonPulseProps) => (
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

type SkeletonGroupProps = {
  lines?: number;
  className?: string;
};

/** Preset group of skeleton lines for message/content loading. */
export const SkeletonGroup = ({ lines = 3, className }: SkeletonGroupProps) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonPulse key={i} width={i === lines - 1 ? '60%' : '90%'} height="14px" />
    ))}
  </div>
);
