'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useCheckoutDialog } from '@/components/CheckoutDialog';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { LogoMarqueeRow } from '@/components/landing/LogoMarqueeRow';
import { useRandomVibeHintPopups } from '@/components/landing/useRandomVibeHintPopups';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { VIBE_HINTS } from '@/data/vibeHints';
import {
  AI_CODING_AGENTS_STRIP,
  TECH_TRUST_STRIP,
  type TechTrustMark,
} from '@/data/visitorLanding';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

interface ActiveHintToastProps {
  readonly mark: TechTrustMark | null;
  readonly visible: boolean;
}

/**
 * Permanent center toast between the dual marquees. The shell always stays
 * mounted (transparent when idle) so the marquees never bounce on show/hide.
 * Last mark is kept while fading out so the box never collapses or flashes empty.
 *
 * @param props - Active mark and visibility.
 * @returns Floating toast region with fixed reserved height.
 */
const ActiveHintToast = ({ mark, visible }: ActiveHintToastProps) => {
  const [displayMark, setDisplayMark] = useState<TechTrustMark | null>(mark);
  const lastMarkRef = useRef<TechTrustMark | null>(mark);

  useEffect(() => {
    if (mark !== null) {
      lastMarkRef.current = mark;
      setDisplayMark(mark);
    }
  }, [mark]);

  const shown = displayMark ?? lastMarkRef.current;
  const hint = shown === null ? null : (VIBE_HINTS[shown.slug] ?? null);
  const hasContent = shown !== null && hint !== null;
  const show = visible && mark !== null && hasContent;

  return (
    <div className="trust-vibe-toast-slot" aria-live="polite">
      {/* Shell is always mounted — opacity only toggles; never unmount. */}
      <div
        aria-hidden={!show}
        className={cn(
          'trust-vibe-toast',
          show ? 'trust-vibe-toast--visible' : 'trust-vibe-toast--hidden',
        )}
        role={show ? 'status' : undefined}
      >
        <span className="trust-vibe-toast__brand">
          {hasContent && shown !== null ? (
            <>
              <LogoMarkIcon
                className="trust-vibe-toast__icon size-5"
                mono={false}
                slug={shown.slug}
              />
              <span className="trust-vibe-toast__label">{shown.label}</span>
            </>
          ) : (
            <>
              <span aria-hidden={true} className="trust-vibe-toast__icon size-5" />
              <span className="trust-vibe-toast__label">&nbsp;</span>
            </>
          )}
        </span>
        <span className="trust-vibe-toast__hint">{hasContent ? hint : '\u00a0'}</span>
      </div>
    </div>
  );
};

/**
 * Dual infinite marquees under the hero. Hover only colorizes logos (scroll
 * never stops). A random logo + vibe line auto-toasts in the permanent center
 * slot for 3s each — no hover required.
 *
 * @returns The rendered tech trust strip.
 * @example
 * <TechTrustStrip />
 */
export const TechTrustStrip = () => {
  // Module-level strip data is stable for the app lifetime.
  const agentMarks = AI_CODING_AGENTS_STRIP.marks;
  const techMarks = TECH_TRUST_STRIP.marks;
  const { open: checkoutOpen } = useCheckoutDialog();
  const { messages, locale } = useLandingLocale();

  const pool = useMemo(
    () => [...AI_CODING_AGENTS_STRIP.marks, ...TECH_TRUST_STRIP.marks] as readonly TechTrustMark[],
    [],
  );

  // Continuous random center toasts — pause only while checkout is open.
  const { activeIndex, pause, resume } = useRandomVibeHintPopups(pool.length);

  useEffect(() => {
    if (checkoutOpen) {
      pause();
      return;
    }
    resume();
  }, [checkoutOpen, pause, resume]);

  const activeMark =
    checkoutOpen || activeIndex === null || activeIndex < 0 || activeIndex >= pool.length
      ? null
      : (pool[activeIndex] ?? null);

  return (
    <section className="trust-strip-band w-full py-14" aria-labelledby="tech-trust-heading">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-0 sm:px-6">
        <div className="space-y-5">
          <TypewriterText
            as="p"
            key={`agents-${locale}`}
            className="trust-strip-caption min-h-[1.5em] px-6 text-center text-sm tracking-wide"
            msPerChar={36}
            text={messages.techTrust.agentsHeading}
          />
          <LogoMarqueeRow
            activeIndex={activeIndex}
            ariaLabel={messages.techTrust.agentsHeading}
            durationDesktop="55s"
            durationMobile="40s"
            indexOffset={0}
            marks={agentMarks}
            reverse={true}
            showHints={false}
          />
        </div>

        <ActiveHintToast mark={activeMark} visible={activeMark !== null} />

        <div className="space-y-5">
          <TypewriterText
            as="p"
            key={`stack-${locale}`}
            className="trust-strip-caption min-h-[1.5em] px-6 text-center text-sm tracking-wide"
            id="tech-trust-heading"
            msPerChar={36}
            text={messages.techTrust.stackHeading}
          />
          <LogoMarqueeRow
            activeIndex={activeIndex}
            ariaLabel={messages.techTrust.stackHeading}
            durationDesktop="80s"
            durationMobile="55s"
            indexOffset={agentMarks.length}
            marks={techMarks}
            reverse={false}
            showHints={false}
          />
        </div>
      </div>
    </section>
  );
};
