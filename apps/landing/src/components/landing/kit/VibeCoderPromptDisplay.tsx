import type { ReactNode } from 'react';

import { TerminalInlineIcon } from '@/components/landing/kit/TerminalInlineIcon';
import type { VibeCoderPromptSegment } from '@/data/vibeCoderPrompts';
import { cn } from '@/lib/utils';

interface VibeCoderPromptDisplayProps {
  readonly segments: readonly VibeCoderPromptSegment[];
  readonly typedChars: number;
  readonly className?: string;
}

/** Renders a partially typed vibe-coder prompt with inline brand/cmd chips. */
export function VibeCoderPromptDisplay({
  segments,
  typedChars,
  className,
}: VibeCoderPromptDisplayProps) {
  let typeableOffset = 0;
  const nodes: ReactNode[] = [];

  for (const [index, segment] of segments.entries()) {
    if (segment.kind === 'icon') {
      if (typedChars >= typeableOffset) {
        nodes.push(
          <TerminalInlineIcon
            className="terminal-inline-icon--prompt"
            key={`icon-${index}`}
            slug={segment.slug}
          />,
        );
      }
      continue;
    }

    const chunk = segment.text;
    const start = typeableOffset;
    typeableOffset += chunk.length;

    if (typedChars <= start) {
      continue;
    }

    const visible = chunk.slice(0, typedChars - start);

    if (segment.kind === 'cmd') {
      nodes.push(
        <span className="ghostty-vibe-tui__cmd" key={`cmd-${index}`}>
          {visible}
        </span>,
      );
    } else {
      nodes.push(
        <span className="ghostty-vibe-tui__prompt-chunk" key={`text-${index}`}>
          {visible}
        </span>,
      );
    }
  }

  return <span className={cn('ghostty-vibe-tui__prompt-text', className)}>{nodes}</span>;
}
