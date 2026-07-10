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
  /** Slightly vary keystroke delay so typing feels live, not metronomic. */
  readonly humanPace?: boolean;
  readonly start?: boolean;
  readonly id?: string;
}

const spinTiming = { duration: 1100, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' } as const;

/**
 * Scroll-triggered typewriter for a single line of copy.
 *
 * @param props - Component props.
 * @returns The rendered TypewriterText element.
 * @example
 * ```tsx
 * <TypewriterText text="Ship like an engineer" humanPace={true} />
 * ```
 */

export const TypewriterText = ({
  text,
  as: Tag = 'p',
  className,
  msPerChar = 48,
  humanPace = false,
  start: startProp,
  id,
}: TypewriterTextProps) => {
  const { ref, inView } = useInViewOnce();
  const start = startProp === undefined ? inView : startProp;

  const { displayText, isComplete } = useTypewriter(text, { start, msPerChar, humanPace });

  return (
    <Tag
      className={cn(!isComplete && start && 'typewriter-cursor', className)}
      id={id}
      ref={startProp === undefined ? (ref as never) : undefined}
    >
      {displayText}
    </Tag>
  );
};

export { spinTiming };
