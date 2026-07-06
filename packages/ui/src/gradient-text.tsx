'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

type GradientTextProps = {
  children: ReactNode;
  colors?: string[];
  animate?: boolean;
  className?: string;
};

/** Text with animated flowing gradient colors. */
export const GradientText = ({
  children,
  colors = ['#7c3aed', '#ec4899', '#3b82f6'],
  animate = true,
  className,
}: GradientTextProps) => (
  <span
    className={cn(
      'bg-clip-text text-transparent bg-[length:200%_200%]',
      animate && 'animate-[gradient-flow_3s_ease-in-out_infinite]',
      className,
    )}
    style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})` }}
  >
    {children}
  </span>
);
