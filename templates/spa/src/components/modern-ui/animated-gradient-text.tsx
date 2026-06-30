import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
}

/** Modern UI–style animated gradient headline for marketing surfaces. */
export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        'inline-flex bg-[linear-gradient(to_right,#6366f1,#ec4899,#6366f1)] bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_linear_infinite]',
        className,
      )}
    >
      {children}
    </span>
  );
}
