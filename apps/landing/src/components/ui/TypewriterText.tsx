'use client';

import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useTypewriter } from '@/hooks/useTypewriter';
import { cn } from '@/lib/utils';

type TypewriterElement = 'p' | 'h1' | 'h2' | 'h3' | 'span';

export interface TypewriterTextProps {
  readonly text: string;
  readonly as?: TypewriterElement;
  readonly className?: string;
  readonly msPerChar?: number;
  readonly start?: boolean;
}

const spinTiming = { duration: 1100, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' } as const;

/** Scroll-triggered typewriter for a single line of copy. */
export function TypewriterText({
  text,
  as: Tag = 'p',
  className,
  msPerChar = 48,
  start: startProp,
}: TypewriterTextProps) {
  const { ref, inView } = useInViewOnce();
  const start = startProp ?? inView;

  const { displayText, isComplete } = useTypewriter(text, { start, msPerChar });

  return (
    <Tag
      className={cn(!isComplete && start && 'typewriter-cursor', className)}
      ref={startProp === undefined ? (ref as never) : undefined}
    >
      {displayText}
    </Tag>
  );
}

export { spinTiming };
