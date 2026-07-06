'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

type ShimmerButtonProps = {
  children: ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

/** Button with animated gradient shimmer. Eye-catching for CTAs and primary actions. */
export const ShimmerButton = ({
  children,
  color = '#7c3aed',
  size = 'md',
  disabled = false,
  className,
  onClick,
}: ShimmerButtonProps) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold text-white transition-all duration-300',
        'hover:scale-105 hover:shadow-lg active:scale-95',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeClasses[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        boxShadow: disabled ? 'none' : `0 4px 20px ${color}44`,
      }}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {!disabled && (
        <span
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
        />
      )}
    </button>
  );
};
