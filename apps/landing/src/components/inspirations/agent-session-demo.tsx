'use client';

import { useEffect, useState } from 'react';

const USER_PROMPT = 'sell a $9 meal-plan app';

/** Agent execution rail: operational command → plain-English outcome. */
const EXECUTION_RAIL = [
  { command: 'create checkout', outcome: 'Checkout created' },
  { command: 'deploy app', outcome: 'App deployed to your domain' },
  { command: 'verify live', outcome: 'Live URL ready' },
] as const;

const LIVE_URL = 'mealplan.app';

/**
 * Animated faux agent session — plain-English in, execution rail out, URL chip at end.
 * Used on the production hero (landing-direction #1: Terminal-to-Live).
 */
export function AgentSessionDemo() {
  const [typedChars, setTypedChars] = useState(0);
  const [railIndex, setRailIndex] = useState(0);
  const [showUrl, setShowUrl] = useState(false);
  const [animate, setAnimate] = useState(true);

  // Respect prefers-reduced-motion: skip the typewriter/rail timers and render the
  // session in its finished state, so motion-sensitive visitors see the outcome
  // without animation (the CSS keyframes are separately disabled in globals.css).
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!query.matches) {
      return;
    }
    setAnimate(false);
    setTypedChars(USER_PROMPT.length);
    setRailIndex(EXECUTION_RAIL.length);
    setShowUrl(true);
  }, []);

  useEffect(() => {
    if (!animate) {
      return;
    }
    if (typedChars < USER_PROMPT.length) {
      const t = setTimeout(() => setTypedChars((n) => n + 1), 45);
      return () => clearTimeout(t);
    }
    if (railIndex === 0) {
      const t = setTimeout(() => setRailIndex(1), 400);
      return () => clearTimeout(t);
    }
    return () => {};
  }, [typedChars, railIndex, animate]);

  useEffect(() => {
    if (!animate || railIndex === 0 || railIndex > EXECUTION_RAIL.length) {
      return;
    }
    if (railIndex === EXECUTION_RAIL.length) {
      const t = setTimeout(() => setShowUrl(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRailIndex((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [railIndex, animate]);

  return (
    <div
      role="img"
      aria-label="Example agent session: you describe a meal-plan app, the agent ships it live"
      className="vybe-terminal-glow overflow-hidden rounded-xl border font-mono text-sm shadow-2xl"
      style={{ borderColor: 'rgba(107,114,128,0.3)', background: '#050608' }}
    >
      <div
        className="flex gap-2 border-b px-4 py-3"
        style={{ borderColor: 'rgba(107,114,128,0.2)' }}
      >
        <span className="size-3 rounded-full bg-red-500/80" />
        <span className="size-3 rounded-full bg-yellow-500/80" />
        <span className="size-3 rounded-full bg-green-500/80" />
        <span className="ms-2 text-neutral-500">vybekiit — session 1</span>
      </div>
      <div className="space-y-3 p-5 text-neutral-200">
        <p>
          <span className="text-[#3DDC84]">you ›</span> {USER_PROMPT.slice(0, typedChars)}
          {typedChars < USER_PROMPT.length ? (
            <span className="vybe-cursor inline-block w-2 bg-[#3DDC84]" aria-hidden={true} />
          ) : null}
        </p>
        <div className="space-y-3 border-s-2 ps-4" style={{ borderColor: 'rgba(61,220,132,0.35)' }}>
          {EXECUTION_RAIL.slice(0, railIndex).map((step, i) => (
            <div
              key={step.command}
              className="vybe-line-in space-y-0.5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="text-neutral-500 text-xs">agent › {step.command}</p>
              <p className="text-[#3DDC84]">→ {step.outcome}</p>
            </div>
          ))}
          {showUrl ? (
            <a
              href={`https://${LIVE_URL}`}
              className="vybe-line-in mt-2 inline-flex items-center gap-2 rounded-full bg-[#3DDC84]/15 px-3 py-1.5 text-[#3DDC84] text-xs transition-colors hover:bg-[#3DDC84]/25"
              style={{ animationDelay: '120ms' }}
            >
              <span aria-hidden={true}>🔗</span>
              {LIVE_URL}
              <span className="rounded bg-[#3DDC84] px-1.5 py-0.5 font-bold text-[#050608]">
                LIVE
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
