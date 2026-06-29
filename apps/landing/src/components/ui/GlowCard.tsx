import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Apply blue border glow (carousel center card). */
  glow?: boolean;
  /** Light UI card styling for mockups. */
  light?: boolean;
}

/** Rounded card with optional cinematic glow or light mockup styling. */
export function GlowCard({ children, className, glow = false, light = false }: GlowCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border transition-all duration-300',
        light ? 'light-ui-card' : 'glass-border bg-[var(--bg-card)]',
        glow && 'blue-border-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}
