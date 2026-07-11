'use client';

import type { SVGProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Tick every 50ms for smooth bar progress. */
const TICK_MS = 50;
/** Full race loop length before reset. */
const LOOP_MS = 14_000;
/**
 * Without path peaks mid payments/integrations step (index 2 of 5 → ~40–60%),
 * then stalls so the sticky label is that step, not sign-in.
 */
const WITHOUT_STUCK_AT = 48;
/** With path finishes at 100%. */
const WITH_FINISH_AT = 100;
/** Step index where the without lane freezes (payments and integrations). */
const WITHOUT_STUCK_STEP = 2;

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Map loop elapsed time (0–1) to without-VybeKiit progress.
 * Fast early climb, then stuck on payments and integrations.
 *
 * @param t - Normalized time in the loop [0, 1].
 * @returns Progress percent 0–100.
 */
const withoutProgressAt = (t: number): number => {
  // Climb hard in the first ~22% of the loop.
  if (t < 0.22) {
    const ease = 1 - (1 - t / 0.22) ** 2;
    return WITHOUT_STUCK_AT * ease;
  }
  // Micro-jitter while stuck so it still feels “alive” but not advancing.
  if (t < 0.82) {
    const wobble = Math.sin(t * 40) * 0.8;
    return Math.min(
      WITHOUT_STUCK_AT + 2,
      Math.max(WITHOUT_STUCK_AT - 1.5, WITHOUT_STUCK_AT + wobble),
    );
  }
  // Soft reset toward 0 for loop.
  const fade = (t - 0.82) / 0.18;
  return WITHOUT_STUCK_AT * (1 - fade);
};

/**
 * Map loop elapsed time (0–1) to with-VybeKiit progress.
 * Slower early, steady climb to 100%, brief hold, then reset.
 *
 * @param t - Normalized time in the loop [0, 1].
 * @returns Progress percent 0–100.
 */
const withProgressAt = (t: number): number => {
  // Steady climb until ~70% of the loop.
  if (t < 0.7) {
    const ease = t / 0.7;
    // Slight ease-in so “without” looks faster at the start.
    const curved = ease ** 1.15;
    return WITH_FINISH_AT * curved;
  }
  // Hold at 100%.
  if (t < 0.88) {
    return WITH_FINISH_AT;
  }
  // Reset for loop.
  const fade = (t - 0.88) / 0.12;
  return WITH_FINISH_AT * (1 - fade);
};

/**
 * Pick which process step is active from progress (0–100).
 *
 * @param progress - Percent complete.
 * @param stepCount - Number of labeled steps.
 * @returns Active step index.
 */
const stepIndexFor = (progress: number, stepCount: number): number => {
  if (stepCount <= 0) {
    return 0;
  }
  if (progress >= 99) {
    return stepCount - 1;
  }
  return Math.min(stepCount - 1, Math.floor((progress / 100) * stepCount));
};

/**
 * Animated “without vs with VybeKiit” build race for vibe coders.
 * Without surges ahead then sticks on payments and integrations.
 * With climbs slower and finishes 100%.
 *
 * @returns Full-width race comparison block.
 * @example
 * <VibeRaceFlow />
 */
export const VibeRaceFlow = () => {
  const reduced = useReducedMotion();
  const { messages } = useLandingLocale();
  const copy = messages.zigZag.race;
  const steps = copy.steps;
  const [withoutPct, setWithoutPct] = useState(reduced ? WITHOUT_STUCK_AT : 0);
  const [withPct, setWithPct] = useState(reduced ? WITH_FINISH_AT : 0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setWithoutPct(WITHOUT_STUCK_AT);
      setWithPct(WITH_FINISH_AT);
      return;
    }

    startedAt.current = performance.now();
    const id = globalThis.setInterval(() => {
      const origin = startedAt.current ?? performance.now();
      const elapsed = performance.now() - origin;
      const t = (elapsed % LOOP_MS) / LOOP_MS;
      setWithoutPct(withoutProgressAt(t));
      setWithPct(withProgressAt(t));
    }, TICK_MS);

    return () => globalThis.clearInterval(id);
  }, [reduced]);

  const withoutStuck = withoutPct >= WITHOUT_STUCK_AT - 2 && withoutPct < 60;
  const withDone = withPct >= 99.5;
  const withoutStep = withoutStuck
    ? Math.min(WITHOUT_STUCK_STEP, steps.length - 1)
    : stepIndexFor(withoutPct, steps.length);
  const withStep = stepIndexFor(withPct, steps.length);

  return (
    <section
      aria-label={copy.heading}
      className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
          {copy.label}
        </p>
        <h2 className="mt-2 font-bold text-2xl tracking-tight sm:text-3xl">{copy.heading}</h2>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed sm:text-base">
          {copy.body}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Without first, as requested */}
        <RaceLane
          done={false}
          label={copy.withoutTitle}
          pct={withoutPct}
          status={withoutStuck ? copy.stuck : copy.building}
          statusTone={withoutStuck ? 'stuck' : 'running'}
          stepIndex={withoutStep}
          steps={steps}
          trackClass="bg-amber-500"
        />

        <RaceLane
          done={withDone}
          label={copy.withTitle}
          pct={withPct}
          status={withDone ? copy.finished : copy.building}
          statusTone={withDone ? 'done' : 'running'}
          stepIndex={withStep}
          steps={steps}
          trackClass="bg-blue-600"
        />
      </div>
    </section>
  );
};

interface RaceLaneProps {
  readonly label: string;
  readonly pct: number;
  readonly status: string;
  readonly statusTone: 'running' | 'stuck' | 'done';
  readonly steps: readonly string[];
  readonly stepIndex: number;
  readonly trackClass: string;
  readonly done: boolean;
}

/**
 * One progress lane in the race comparison.
 *
 * @param props - Lane visual state.
 * @returns Lane card.
 */
const RaceLane = ({
  label,
  pct,
  status,
  statusTone,
  steps,
  stepIndex,
  trackClass,
  done,
}: RaceLaneProps) => {
  const display = Math.round(Math.min(100, Math.max(0, pct)));

  return (
    <div
      className={cn(
        'rounded-xl border p-4 sm:p-5',
        statusTone === 'stuck' && 'border-amber-500/35 bg-amber-500/[0.04]',
        statusTone === 'done' && 'border-emerald-500/35 bg-emerald-500/[0.04]',
        statusTone === 'running' && 'border-border/80 bg-background/60',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-sm sm:text-base">{label}</p>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 font-medium text-xs tabular-nums',
            statusTone === 'stuck' && 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
            statusTone === 'done' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
            statusTone === 'running' && 'bg-muted text-muted-foreground',
          )}
        >
          {status} · {display}%
        </span>
      </div>

      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={display}
        className="mt-4 h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-100 ease-linear',
            trackClass,
            statusTone === 'stuck' && 'animate-pulse',
            done && 'bg-emerald-500',
          )}
          style={{ width: `${display}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, index) => {
          const reached = index <= stepIndex && pct > 2;
          const current = index === stepIndex && !done && statusTone !== 'stuck';
          const blocked = statusTone === 'stuck' && index === stepIndex;
          return (
            <li
              key={step}
              className={cn(
                'flex items-start gap-2.5 text-xs sm:text-sm',
                reached ? 'text-foreground' : 'text-muted-foreground/55',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border',
                  blocked && 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300',
                  done && reached && 'border-emerald-500 bg-emerald-500 text-white',
                  !(blocked || done) && current && 'border-blue-600 bg-blue-600 text-white',
                  !(blocked || done) &&
                    reached &&
                    !current &&
                    'border-blue-600/35 bg-blue-600/10 text-blue-700 dark:text-blue-300',
                  !reached && 'border-border text-muted-foreground/50',
                )}
              >
                {done && reached ? <RaceCheckIcon className="size-3.5" /> : null}
                {!(done && reached) && blocked ? <RaceStuckIcon className="size-3.5" /> : null}
                {(done && reached) || blocked ? null : (
                  <RaceStepIcon className="size-3.5" stepIndex={index} />
                )}
              </span>
              <span
                className={cn(
                  'pt-0.5',
                  current && 'font-medium',
                  blocked && 'font-medium text-amber-800 dark:text-amber-300',
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

interface RaceStepIconProps extends IconProps {
  readonly stepIndex: number;
}

/**
 * Custom glyph for a race process step (screens → deploy).
 *
 * @param props - SVG props plus step index 0–4.
 * @returns Step icon.
 */
const RaceStepIcon = ({ stepIndex, className, ...props }: RaceStepIconProps) => {
  switch (stepIndex) {
    case 0:
      return <RaceScreensIcon className={className} {...props} />;
    case 1:
      return <RaceSignInIcon className={className} {...props} />;
    case 2:
      return <RacePaymentsIcon className={className} {...props} />;
    case 3:
      return <RaceShieldIcon className={className} {...props} />;
    default:
      return <RaceDeployIcon className={className} {...props} />;
  }
};

/**
 * Browser / first-screens layout mark.
 *
 * @param props - SVG props.
 * @returns Screens icon.
 */
const RaceScreensIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="4" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 13h4M8 16h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
);

/**
 * Key / session sign-in mark.
 *
 * @param props - SVG props.
 * @returns Sign-in icon.
 */
const RaceSignInIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="9" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12.2 10h7.3m-2.2-2.2L19.5 10l-2.2 2.2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M5 18.5c.8-2.2 2.6-3.5 4-3.5s3.2 1.3 4 3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Card + plug: payments and integrations.
 *
 * @param props - SVG props.
 * @returns Payments icon.
 */
const RacePaymentsIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect height="11" rx="1.8" stroke="currentColor" strokeWidth="1.8" width="15" x="2.5" y="5" />
    <path d="M2.5 9.2h15" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6 13.2h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    <path
      d="M17.5 14.5v2.2c0 1.2.9 2.2 2 2.2h1.2M19.5 12.8v1.7M21 12.8v1.7"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Shield for protect / harden.
 *
 * @param props - SVG props.
 * @returns Shield icon.
 */
const RaceShieldIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 3.5 5 6.2v5.2c0 4.1 2.8 7.9 7 9.1 4.2-1.2 7-5 7-9.1V6.2L12 3.5Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="m9 12 2 2 4-4.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Rocket / go-live deploy mark.
 *
 * @param props - SVG props.
 * @returns Deploy icon.
 */
const RaceDeployIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M13.2 4.2c2.8 1 5.4 3.6 6.4 6.4-1.5.4-3.5.2-5-.8s-1.8-3.5-1.4-5.6Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M12.4 8.8 7.2 14c-.7.7-.7 1.9 0 2.6l.2.2c.7.7 1.9.7 2.6 0l5.2-5.2"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M7 17.5 5 19.5M9.2 19.2 7.8 20.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
    <circle cx="14.2" cy="9.8" fill="currentColor" r="1.1" />
  </svg>
);

/**
 * Checkmark for completed steps on the with lane.
 *
 * @param props - SVG props.
 * @returns Check icon.
 */
const RaceCheckIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m5 12.5 5 5 9-11"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </svg>
);

/**
 * Alert mark when the without lane is blocked on a step.
 *
 * @param props - SVG props.
 * @returns Stuck / alert icon.
 */
const RaceStuckIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 8.5v5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    <circle cx="12" cy="16.5" fill="currentColor" r="1.1" />
    <path
      d="M10.4 4.8 3.6 17.2c-.7 1.2.2 2.8 1.6 2.8h13.6c1.4 0 2.3-1.6 1.6-2.8L13.6 4.8c-.7-1.2-2.5-1.2-3.2 0Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);
