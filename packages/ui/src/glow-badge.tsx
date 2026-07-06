'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

type GlowBadgeProps = {
  children: ReactNode;
  color?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
};

/**
 * Badge with colored glow effect. Extends the base Badge concept.
 * Great for agent statuses, MCP tags, tech stack indicators, and live counters.
 */
export const GlowBadge = ({
  children,
  color = '#7c3aed',
  variant = 'solid',
  size = 'md',
  pulse = false,
  className,
}: GlowBadgeProps) => {
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
