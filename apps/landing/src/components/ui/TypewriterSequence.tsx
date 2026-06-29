'use client';

import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useTypewriterSequence } from '@/hooks/useTypewriterSequence';
import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

export interface TypewriterLine {
  readonly text: string;
  readonly as?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  readonly className?: string;
}

export interface TypewriterSequenceProps {
  readonly lines: readonly TypewriterLine[];
  readonly className?: string;
  readonly msPerChar?: number;
  readonly renderBetween?: (index: number) => ReactNode;
  readonly renderLineWrap?: (
    index: number,
    line: ReactNode,
    state: { lineComplete: boolean; visible: boolean },
  ) => ReactNode;
}

/** Scroll-triggered sequential typewriter for multiple lines in one block. */
export function TypewriterSequence({
  lines,
  className,
  msPerChar = 48,
  renderBetween,
  renderLineWrap,
}: TypewriterSequenceProps) {
  const { ref, inView } = useInViewOnce();
  const texts = lines.map((line) => line.text);
  const { displayLines, activeIndex, isComplete } = useTypewriterSequence(texts, {
    start: inView,
    msPerChar,
  });

  return (
    <div className={className} ref={ref as never}>
      {lines.map((line, index) => {
        const Tag = (line.as ?? 'p') as ElementType;
        const visible = index <= activeIndex || isComplete;
        const showCursor = visible && index === activeIndex && !isComplete;
        const lineComplete =
          visible && (index < activeIndex || (index === activeIndex && isComplete));

        const lineNode = (
          <Tag className={cn(showCursor && 'typewriter-cursor', line.className)}>
            {visible ? displayLines[index] : ''}
          </Tag>
        );

        return (
          <span key={`${line.text}-${index}`}>
            {renderBetween?.(index)}
            {renderLineWrap ? renderLineWrap(index, lineNode, { lineComplete, visible }) : lineNode}
          </span>
        );
      })}
    </div>
  );
}
