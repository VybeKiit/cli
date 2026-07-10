'use client';

import { TypewriterText } from '@/components/ui/TypewriterText';
import { handwriting } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const NOTE = 'this entire landing page was built with VybeKiit';

/**
 * Handwritten typewriter caption under the hero terminal — meta product proof
 * that vibe coders clock while watching the agent demo.
 *
 * @returns Handwriting typewriter line, once on view.
 * @example
 * <BuiltWithVybeKiitNote />
 */
export const BuiltWithVybeKiitNote = () => (
  <div
    aria-label={NOTE}
    className={cn(
      handwriting.variable,
      handwriting.className,
      'built-with-note pointer-events-none select-none',
    )}
    role="note"
  >
    <TypewriterText
      as="p"
      className="built-with-note__text min-h-[1.4em] text-center sm:text-start"
      humanPace={true}
      msPerChar={36}
      text={NOTE}
    />
  </div>
);
