'use client';

import type { ReactNode } from 'react';
import { cn } from './utils';

interface GradientTextProps {
  readonly children?: ReactNode;
  readonly colors?: readonly string[];
  readonly animate?: boolean;
  readonly className?: string;
}

/**
 * Text with optional animated flowing gradient colors.
 *
 * @param props - Text content, gradient colors, animation flag, and classes.
 * @returns A gradient-filled text span.
 * @example
 * <GradientText colors={['#22c55e', '#3b82f6']}>Ready</GradientText>;
 */
export const GradientText = (props: GradientTextProps) => {
  const {
    children = null,
    colors = ['#7c3aed', '#ec4899', '#3b82f6'],
    animate = true,
    className = '',
  } = props;

  return (
    <span
      className={cn(
        'bg-[length:200%_200%] bg-clip-text text-transparent',
        animate && 'animate-[gradient-flow_3s_ease-in-out_infinite]',
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})` }}
    >
      {children}
    </span>
  );
};
