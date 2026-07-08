'use client';

import { BuilderAssistantMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import { useCallback, useEffect, useState } from 'react';
import {
  MiniTerminalChrome,
  type TerminalChromeVariant,
} from '@/components/landing/kit/MiniTerminalChrome';
import { PricingVibeCoderTui } from '@/components/landing/PricingVibeCoderTui';
import { PRICE } from '@/data/site';

const PROMPT = 'npx vybekiit@latest init';

/** How long each OS chrome stays on screen before switching (shows cross-platform support). */
const OS_SWITCH_INTERVAL_MS = 4200;

const OS_CHROME: Record<TerminalChromeVariant, { title: string }> = {
  macos: { title: 'ghostty — zsh' },
  windows: { title: 'Windows PowerShell' },
};

const OUTPUT_LINES = [
  { tone: 'muted' as const, text: '✓ Web · Mobile · Extension scaffolded' },
  { tone: 'muted' as const, text: '✓ Stripe checkout configured' },
  { tone: 'muted' as const, text: '✓ Agent layer synced' },
  { tone: 'accent' as const, text: `→ Unlock lifetime access — ${PRICE.display} one-time` },
] as const;

const CLOSE_REBUKE_LINES = [
  "Hey! Don't close me.",
  "I'm still vibe-coding for you.",
  'Let me proceed — run the init first.',
] as const;

const REBUKE_LINE_DELAY_MS = 480;

/**
 * Ghostty-style terminal above pricing checkout — types the install command, then reveals outcomes.
 *
 * @returns The rendered PricingCheckoutTerminal element.
 * @example
 * ```tsx
 * <PricingCheckoutTerminal />
 * ```
 */

export const PricingCheckoutTerminal = () => {
  const [typedChars, setTypedChars] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [rebukeRun, setRebukeRun] = useState(0);
  const [visibleRebukeLines, setVisibleRebukeLines] = useState(0);
  const [osVariant, setOsVariant] = useState<TerminalChromeVariant>('macos');

  const handleCloseClick = useCallback(() => {
    setRebukeRun((run) => run + 1);
    setVisibleRebukeLines(0);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!query.matches) {
      return;
    }
    setAnimate(false);
    setTypedChars(PROMPT.length);
    setVisibleLines(OUTPUT_LINES.length);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = globalThis.setInterval(
      () => setOsVariant((current) => (current === 'macos' ? 'windows' : 'macos')),
      OS_SWITCH_INTERVAL_MS,
    );
    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!animate) {
      return;
    }
    let pendingTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
    if (typedChars < PROMPT.length) {
      pendingTimer = globalThis.setTimeout(() => setTypedChars((count) => count + 1), 42);
    } else if (visibleLines < OUTPUT_LINES.length) {
      pendingTimer = globalThis.setTimeout(() => setVisibleLines((count) => count + 1), 520);
    }
    return pendingTimer === undefined ? undefined : () => globalThis.clearTimeout(pendingTimer);
  }, [animate, typedChars, visibleLines]);

  useEffect(() => {
    if (rebukeRun === 0) {
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisibleRebukeLines(CLOSE_REBUKE_LINES.length);
      return;
    }

    if (visibleRebukeLines >= CLOSE_REBUKE_LINES.length) {
      return;
    }

    const timer = globalThis.setTimeout(
      () => setVisibleRebukeLines((count) => count + 1),
      visibleRebukeLines === 0 ? 80 : REBUKE_LINE_DELAY_MS,
    );
    return () => globalThis.clearTimeout(timer);
  }, [rebukeRun, visibleRebukeLines]);

  return (
    <MiniTerminalChrome
      className="mb-6 w-full"
      onCloseClick={handleCloseClick}
      title={OS_CHROME[osVariant].title}
      variant={osVariant}
    >
      <PricingVibeCoderTui />
      <div
        aria-label="Example terminal session installing VybeKiit"
        className="ghostty-terminal__session ghostty-terminal__session--install"
        role="img"
      >
        <p className="ghostty-terminal__line">
          <span className="ghostty-terminal__prompt">~</span>
          <span className="ghostty-terminal__prompt-divider"> % </span>
          <span>{PROMPT.slice(0, typedChars)}</span>
          {typedChars < PROMPT.length ? (
            <span aria-hidden={true} className="ghostty-terminal__cursor" />
          ) : null}
        </p>

        {OUTPUT_LINES.slice(0, visibleLines).map((line, index) => (
          <p
            className="ghostty-terminal__line vybe-line-in ghostty-terminal__line--output"
            data-tone={line.tone}
            key={line.text}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {line.text}
          </p>
        ))}
      </div>

      {rebukeRun > 0 ? (
        <div
          aria-live="polite"
          className="ghostty-terminal__session ghostty-terminal__session--rebuke"
          key={rebukeRun}
        >
          {visibleRebukeLines > 0 ? (
            <div className="ghostty-terminal__rebuke-agent vybe-line-in">
              <BuilderAssistantMark
                active={true}
                assistant="claude"
                className="ghostty-terminal__rebuke-mark"
                mood="sad"
              />
              <span className="ghostty-terminal__rebuke-label">Claude Code</span>
            </div>
          ) : null}

          {CLOSE_REBUKE_LINES.slice(0, visibleRebukeLines).map((line, index) => (
            <p
              className="ghostty-terminal__line vybe-line-in ghostty-terminal__line--output"
              data-tone="angry"
              key={line}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </MiniTerminalChrome>
  );
};
