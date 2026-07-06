'use client';

import type { ReactNode } from 'react';
import { Card } from './card';
import { cn } from './utils';

type GlowCardProps = {
  children: ReactNode;
  color?: string;
  className?: string;
  active?: boolean;
  onClick?: () => void;
};

/**
 * Card with animated gradient glow border. Extends the base Card primitive.
 * Perfect for feature cards, agent cards, and status displays.
 */
export const GlowCard = ({
  children,
  color = '#7c3aed',
  className,
  active = false,
  onClick,
}: GlowCardProps) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={cn(
      'relative rounded-2xl p-[1px] transition-all duration-500',
      active ? 'shadow-[0_0_24px_var(--glow-color)]' : '',
      onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
      className,
    )}
    style={{ '--glow-color': `${color}44` } as React.CSSProperties}
  >
    <div
      className={cn(
        'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500',
        active && 'opacity-100 animate-pulse',
      )}
      style={{ background: `linear-gradient(135deg, ${color}33, transparent, ${color}33)` }}
    />
    <Card className="relative border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
      <div className="p-4">{children}</div>
    </Card>
  </div>
);
