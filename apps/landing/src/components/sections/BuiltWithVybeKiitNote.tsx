'use client';

import { TypewriterText } from '@/components/ui/TypewriterText';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { handwriting } from '@/lib/fonts';
import { cn } from '@/lib/utils';

/**
 * Handwritten typewriter caption under the hero terminal — meta product proof
 * that vibe coders clock while watching the agent demo.
 *
 * @returns Handwriting typewriter line, once on view.
 * @example
 * <BuiltWithVybeKiitNote />
 */
export const BuiltWithVybeKiitNote = () => {
  const { messages, locale } = useLandingLocale();
  const note = messages.builtWith.note;

  return (
    <div
      aria-label={note}
      className={cn(
        handwriting.variable,
        handwriting.className,
        'built-with-note pointer-events-none select-none',
      )}
      role="note"
    >
      <TypewriterText
        as="p"
        // Remount when locale changes so the typewriter restarts in the new language.
        key={locale}
        className="built-with-note__text min-h-[1.4em] text-center sm:text-start"
        humanPace={true}
        msPerChar={36}
        text={note}
      />
    </div>
  );
};
