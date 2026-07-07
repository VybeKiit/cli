'use client';

import type { ReactNode } from 'react';
import { Card } from './card';
import { cn } from './utils';

interface GlowCardProps {
  readonly children?: ReactNode;
  readonly color?: string;
  readonly className?: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

/**
 * Card with an animated gradient glow border around the base Card primitive.
 *
 * @param props - Card content, glow color, active state, click handler, and classes.
 * @returns An interactive glow-framed card.
 * @example
 * <GlowCard active color="#22c55e">Ready</GlowCard>;
 */
export const GlowCard = (props: GlowCardProps) => {
  const { children = null, color = '#7c3aed', className = '', active = false, onClick } = props;

  return (
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
};
