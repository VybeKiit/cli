'use client';

import { BuilderAssistantMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import { useEffect, useState } from 'react';
import { ClockIcon } from '@/components/ui/CustomIcons';

const LABEL = 'LIMITED TIME OFFER';
const BUBBLE_LINE =
  "Hey — if I weren't an AI I would've bought it. Byye, I go help a vibe coder build the next startup/exit.";

/** Delay after the price drop before Claude peeks in (lets the green-wave land first). */
const PEEK_DELAY_MS = 650;
const TYPE_SPEED_MS = 26;

/** Split the label so the octopus can nest behind the final "R" without breaking the word. */
const LABEL_HEAD = LABEL.slice(0, -1);
const LABEL_TAIL = LABEL.slice(-1);

/**
 * "LIMITED TIME OFFER" label. Once the price finishes dropping, a Claude Code octopus
 * peeks from behind the last "R" and types a farewell chat bubble.
 */
export function PricingOfferPeek({ dropped = false }: { readonly dropped?: boolean }) {
  const [peeking, setPeeking] = useState(false);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (!dropped) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPeeking(true);
      setTypedChars(BUBBLE_LINE.length);
      return;
    }
    const timer = globalThis.setTimeout(() => setPeeking(true), PEEK_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [dropped]);

  useEffect(() => {
    if (!peeking || typedChars >= BUBBLE_LINE.length) {
      return;
    }
    const timer = globalThis.setTimeout(() => setTypedChars((count) => count + 1), TYPE_SPEED_MS);
    return () => globalThis.clearTimeout(timer);
  }, [peeking, typedChars]);

  const bubbleOpen = peeking && typedChars > 0;

  return (
    <p className="landing-label pricing-offer-peek">
      <ClockIcon className="h-4 w-4" />
      <span className="pricing-offer-peek__word">
        {LABEL_HEAD}
        <span className="pricing-offer-peek__anchor">
          {LABEL_TAIL}
          {peeking ? (
            <span className="pricing-offer-peek__claude" data-open={peeking}>
              <BuilderAssistantMark
                assistant="claude"
                className="pricing-offer-peek__mark"
                pose="reviewing"
                size="l"
              />
            </span>
          ) : null}
        </span>
      </span>

      {bubbleOpen ? (
        <span className="pricing-offer-peek__bubble" role="status">
          {BUBBLE_LINE.slice(0, typedChars)}
          {typedChars < BUBBLE_LINE.length ? (
            <span aria-hidden={true} className="pricing-offer-peek__caret" />
          ) : null}
        </span>
      ) : null}
    </p>
  );
}
