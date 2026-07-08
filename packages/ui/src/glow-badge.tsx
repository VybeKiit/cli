'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

interface GlowBadgeProps {
  readonly children?: ReactNode;
  readonly color?: string;
  readonly variant?: 'solid' | 'outline' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly pulse?: boolean;
  readonly className?: string;
}

/**
 * Badge with a colored glow effect for compact status labels.
 *
 * @param props - Badge content, color, visual variant, size, pulse state, and classes.
 * @returns A glow-styled badge element.
 * @example
 * <GlowBadge color="#22c55e" pulse>Live</GlowBadge>;
 */
export const GlowBadge = (props: GlowBadgeProps) => {
  const {
    children = null,
    color = '#7c3aed',
    variant = 'solid',
    size = 'md',
    pulse = false,
    className = '',
  } = props;
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  const variantClasses = {
    solid: 'border-transparent',
    outline: 'bg-transparent',
    ghost: 'border-transparent bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all duration-300',
        sizeClasses[size],
        variantClasses[variant],
        pulse && 'animate-pulse',
        className,
      )}
      style={{
        borderColor: variant === 'outline' ? `${color}66` : undefined,
        backgroundColor: variant === 'solid' ? `${color}22` : undefined,
        color,
        boxShadow: `0 0 12px ${color}33`,
      }}
    >
      {children}
    </span>
  );
};
