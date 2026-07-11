'use client';

import type { WalkthroughStep } from '@vybekiit/walkthrough';
import type { WalkthroughState } from '@vybekiit/walkthrough/web';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@vybekiit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vybekiit/ui/dialog';
import { cn } from '@/lib/utils';
import './walkthrough.css';

type WalkthroughVariant = 'spotlight' | 'dialog';

interface WalkthroughProps {
  readonly steps: readonly WalkthroughStep[];
  readonly state: WalkthroughState;
  /** Presentation preset — spotlight coach-mark (default) or centered dialog. */
  readonly variant?: WalkthroughVariant;
  /** Fire confetti when the final step completes (spotlight only). */
  readonly celebrate?: boolean;
  /** Optional class on the spotlight root (e.g. raise z-index above a floating panel). */
  readonly className?: string;
}

const CONFETTI_COLORS = ['#60a5fa', '#3b82f6', '#fbbf24', '#f8fafc', '#34d399'];

/** Full-viewport celebration — bursts from edges and center on completion. */
const fireCelebrationConfetti = async () => {
  try {
    const confetti = (await import('canvas-confetti')).default;
    confetti({
      particleCount: 120,
      spread: 100,
      startVelocity: 42,
      origin: { x: 0.5, y: 0.45 },
      colors: CONFETTI_COLORS,
      ticks: 160,
      gravity: 0.9,
      scalar: 1.1,
    });
  } catch {
    // confetti is celebratory only
  }
};

/**
 * Reusable first-run walkthrough. One engine (`useWalkthrough`) drives two presets: a spotlight
 * coach-mark (report-mode / assistant-chat) or a centered dialog (UI library). Generalized from
 * report-mode's ReportModeTutorial + the UI library's LibraryTutorial so every surface shares one.
 *
 * @param props - Walkthrough steps, state machine, visual variant, and celebration option.
 * @returns A spotlight or dialog walkthrough while active, otherwise `null`.
 * @example
 * <Walkthrough steps={steps} state={walkthrough} variant="spotlight" />
 */
const Walkthrough = ({
  steps,
  state,
  variant = 'spotlight',
  celebrate = false,
  className,
}: WalkthroughProps) => {
  const { active, stepIndex, next, back, skip, complete } = state;
  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const handleNext = useCallback(async () => {
    if (isLast) {
      if (celebrate) {
        await fireCelebrationConfetti();
      }
      complete();
      return;
    }
    next();
  }, [celebrate, complete, isLast, next]);

  if (!(active && step)) {
    return null;
  }

  if (variant === 'dialog') {
    return (
      <WalkthroughDialog
        isLast={isLast}
        onBack={back}
        onNext={handleNext}
        onSkip={skip}
        step={step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
      />
    );
  }

  return (
    <WalkthroughSpotlight
      {...(className === undefined ? {} : { className })}
      isLast={isLast}
      onNext={handleNext}
      onSkip={skip}
      step={step}
      stepIndex={stepIndex}
      totalSteps={steps.length}
    />
  );
};

interface SubViewProps {
  readonly step: WalkthroughStep;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly isLast: boolean;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly className?: string;
}

const SPOTLIGHT_PAD = 10;

const findTarget = (selector: string): Element | null => {
  const nodes = document.querySelectorAll(selector);
  if (nodes.length <= 1) {
    return nodes.item(0);
  }
  let best: Element | null = null;
  let bestArea = 0;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        best = node;
      }
    }
  }
  if (best !== null) {
    return best;
  }
  return nodes.item(0);
};

/** Spotlight-hole overlay that tracks the current step's target through resize/scroll. */
const WalkthroughSpotlight = ({
  step,
  stepIndex,
  totalSteps,
  isLast,
  onNext,
  onSkip,
  className,
}: SubViewProps) => {
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!step.target) {
      setSpotlight(null);
      return;
    }
    const el = findTarget(step.target);
    setSpotlight(el === null ? null : el.getBoundingClientRect());
  }, [step.target]);

  useEffect(() => {
    measure();
    const target = step.target ? findTarget(step.target) : null;
    const observer = target ? new ResizeObserver(measure) : null;
    observer?.observe(target as Element);

    let frame = 0;
    let frames = 0;
    const tick = () => {
      measure();
      frames += 1;
      if (frames < 120) {
        frame = globalThis.requestAnimationFrame(tick);
      }
    };
    frame = globalThis.requestAnimationFrame(tick);

    globalThis.addEventListener('resize', measure);
    globalThis.addEventListener('scroll', measure, true);
    return () => {
      observer?.disconnect();
      globalThis.cancelAnimationFrame(frame);
      globalThis.removeEventListener('resize', measure);
      globalThis.removeEventListener('scroll', measure, true);
    };
  }, [measure, step.target]);

  const spotlightStyle = spotlight
    ? {
        top: spotlight.top - SPOTLIGHT_PAD,
        left: spotlight.left - SPOTLIGHT_PAD,
        width: spotlight.width + SPOTLIGHT_PAD * 2,
        height: spotlight.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  return (
    <div className={cn('vybe-walkthrough', className)} data-testid="vybe-walkthrough">
      {spotlightStyle ? (
        <>
          <div className="vybe-walkthrough-hole" style={spotlightStyle} />
          <div className="vybe-walkthrough-ring" style={spotlightStyle} />
        </>
      ) : null}
      <div className="vybe-walkthrough-card">
        <p className="vybe-walkthrough-step">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h3 className="vybe-walkthrough-title">{step.title}</h3>
        <p className="vybe-walkthrough-body">{step.body}</p>
        <div className="vybe-walkthrough-actions">
          <button className="vybe-walkthrough-skip" onClick={onSkip} type="button">
            Skip
          </button>
          <button
            className="vybe-walkthrough-next"
            data-testid="vybe-walkthrough-next"
            onClick={onNext}
            type="button"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Centered dialog card with a highlighted target + progress dots. */
const WalkthroughDialog = ({
  step,
  stepIndex,
  totalSteps,
  isLast,
  onNext,
  onSkip,
  onBack,
}: SubViewProps & { readonly onBack: () => void }) => {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onSkip();
      }
    },
    [onSkip],
  );

  useEffect(() => {
    for (const node of document.querySelectorAll('[data-walkthrough-highlight]')) {
      node.removeAttribute('data-walkthrough-highlight');
    }
    if (!step.target) {
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
      return;
    }
    el.setAttribute('data-walkthrough-highlight', 'true');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    return () => el.removeAttribute('data-walkthrough-highlight');
  }, [step.target]);

  return (
    <>
      <div className="vybe-walkthrough-dialog-backdrop" />
      <Dialog onOpenChange={handleOpenChange} open={true}>
        <DialogContent className="z-[70] max-w-md">
          <DialogHeader>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <DialogTitle>{step.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{step.body}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, index) => `dot-${index}`).map(
              (dotKey, index) => (
                <div
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    index <= stepIndex ? 'bg-primary' : 'bg-muted',
                  )}
                  key={dotKey}
                />
              ),
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button disabled={stepIndex === 0} onClick={onBack} type="button" variant="ghost">
              Back
            </Button>
            <div className="flex gap-2">
              <Button onClick={onSkip} type="button" variant="outline">
                Skip
              </Button>
              <Button onClick={onNext} type="button">
                {isLast ? 'Done' : 'Next'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export type { WalkthroughVariant };
export { Walkthrough };
