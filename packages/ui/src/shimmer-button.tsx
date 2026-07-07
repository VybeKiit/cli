'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

interface ShimmerButtonProps {
  readonly children?: ReactNode;
  readonly color?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
}

/**
 * Button with an animated gradient shimmer for primary actions.
 *
 * @param props - Button content, color, size, disabled state, classes, and click handler.
 * @returns A shimmer-styled button element.
 * @example
 * <ShimmerButton onClick={save}>Save</ShimmerButton>;
 */
export const ShimmerButton = (props: ShimmerButtonProps) => {
  const {
    children = null,
    color = '#7c3aed',
    size = 'md',
    disabled = false,
    className = '',
    onClick,
  } = props;
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
        'disabled:pointer-events-none disabled:opacity-50',
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
