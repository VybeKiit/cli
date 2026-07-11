'use client';

import { useEffect, useRef, useState } from 'react';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

type LoginPhase = 'idle' | 'press' | 'oauth' | 'success';

const PHASE_MS = {
  idle: 1600,
  press: 700,
  oauth: 1800,
  success: 2600,
} as const;

/**
 * Fire a short confetti burst from the center of a mock frame.
 *
 * @param frame - Login mock root element used for origin math.
 * @returns Resolves when the burst is triggered (or skipped).
 */
const burstLoginConfetti = async (frame: HTMLElement | null): Promise<void> => {
  if (!frame || typeof window === 'undefined') {
    return;
  }
  const rect = frame.getBoundingClientRect();
  const originX = (rect.left + rect.width / 2) / window.innerWidth;
  const originY = (rect.top + rect.height * 0.42) / window.innerHeight;

  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 70,
      spread: 68,
      startVelocity: 26,
      origin: { x: originX, y: originY },
      colors: ['#3b82f6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f8fafc'],
      ticks: 140,
      gravity: 0.95,
      scalar: 0.8,
      zIndex: 40,
      disableForReducedMotion: true,
    });
  } catch {
    // Demo-only — ignore load failures.
  }
};

/**
 * Login page recipe mock: Google OAuth + magic link, with a looping simulate-login flow.
 *
 * @returns Animated login product UI for the zig-zag section.
 * @example
 * <LoginRecipeMock />
 */
export const LoginRecipeMock = () => {
  const reduced = useReducedMotion();
  const { messages } = useLandingLocale();
  const copy = messages.zigZag.auth;
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const frameRef = useRef<HTMLDivElement>(null);
  const lastBurstPhase = useRef<LoginPhase | null>(null);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const order: readonly LoginPhase[] = ['idle', 'press', 'oauth', 'success'];
    let index = 0;
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;

    const tick = () => {
      const current = order[index] ?? 'idle';
      setPhase(current);
      const nextIndex = (index + 1) % order.length;
      const hold = PHASE_MS[current];
      index = nextIndex;
      timer = globalThis.setTimeout(tick, hold);
    };

    tick();
    return () => {
      if (timer !== undefined) {
        globalThis.clearTimeout(timer);
      }
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || phase !== 'success') {
      if (phase !== 'success') {
        lastBurstPhase.current = phase;
      }
      return;
    }
    if (lastBurstPhase.current === 'success') {
      return;
    }
    lastBurstPhase.current = 'success';
    void burstLoginConfetti(frameRef.current);
  }, [phase, reduced]);

  const showSuccess = phase === 'success';

  return (
    <div
      ref={frameRef}
      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
    >
      <div className="flex items-center gap-2 border-border/70 border-b bg-muted/30 px-4 py-2.5">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </span>
        <div className="min-w-0 flex-1 truncate rounded-md bg-background/80 px-2.5 py-1 text-center text-xs text-muted-foreground">
          app.yoursite.com/login
        </div>
      </div>

      <div className="relative min-h-[320px] bg-gradient-to-b from-muted/40 to-card px-6 py-8">
        <div
          className={cn(
            'mx-auto w-full max-w-[280px] transition-all duration-500',
            showSuccess ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100',
          )}
        >
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
              <VybeLogoIcon className="size-7 text-white" />
            </span>
            <p className="font-semibold text-base leading-none">{copy.welcomeBack}</p>
            <p className="text-muted-foreground text-xs">{copy.signInSubtitle}</p>
          </div>

          <div className="space-y-2.5">
            <button
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-start font-medium text-sm shadow-sm transition-all duration-300',
                phase === 'press' || phase === 'oauth'
                  ? 'scale-[1.02] border-blue-500 ring-2 ring-blue-500/25'
                  : 'border-border',
              )}
              type="button"
            >
              <LogoMarkIcon className="size-4 shrink-0" slug="google" />
              <span className="min-w-0 flex-1 truncate">{copy.googleCta}</span>
              {phase === 'oauth' ? (
                <span
                  aria-hidden={true}
                  className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
                />
              ) : null}
            </button>

            <div className="flex items-center gap-2 py-1">
              <span className="h-px flex-1 bg-border" />
              <span className="shrink-0 text-muted-foreground text-xs">{copy.orEmail}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-muted-foreground text-sm">
              {copy.emailPlaceholder}
            </div>
            <div className="rounded-lg bg-blue-600 py-2.5 text-center font-medium text-sm text-white">
              {copy.magicLink}
            </div>
          </div>

          {phase === 'oauth' ? (
            <p className="mt-4 text-center font-medium text-blue-600 text-xs" role="status">
              {copy.signingIn}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 transition-all duration-500',
            showSuccess ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
          )}
          role="status"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <svg aria-hidden={true} className="size-7" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12.5l5 5 9-11"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
            </svg>
          </span>
          <div className="text-center">
            <p className="font-semibold text-base">{copy.successTitle}</p>
            <p className="mt-1 text-muted-foreground text-sm">{copy.successBody}</p>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs shadow-sm">
            <LogoMarkIcon className="size-3.5" slug="google" />
            <span className="font-medium">{copy.signedInAs}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
