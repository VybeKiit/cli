'use client';

import {
  REPORT_TUTORIAL_STEPS,
  type ReportTutorialStepId,
} from '@/components/report-mode/shared/report-mode-copy';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

type ReportModeTutorialProps = {
  readonly active: boolean;
  readonly stepIndex: number;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly onComplete: () => void;
};

function stepTargetId(stepId: ReportTutorialStepId): string {
  return `[data-report-tutorial="${stepId}"]`;
}

const CONFETTI_COLORS = ['#60a5fa', '#3b82f6', '#fbbf24', '#f8fafc', '#34d399'];

function findTutorialTarget(stepId: ReportTutorialStepId): Element | null {
  const nodes = document.querySelectorAll(stepTargetId(stepId));
  if (nodes.length === 0) {
    return null;
  }
  if (nodes.length === 1) {
    return nodes[0] ?? null;
  }

  let best: Element | null = null;
  let bestArea = 0;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }
    const area = rect.width * rect.height;
    if (area > bestArea) {
      bestArea = area;
      best = node;
    }
  }
  return best ?? nodes[0] ?? null;
}

/** Full-viewport celebration — bursts from edges and center, not just the dock corner. */
async function fireCelebrationConfetti() {
  try {
    const confetti = (await import('canvas-confetti')).default;
    const end = Date.now() + 2200;

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

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.55 },
        colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.55 },
        colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 3,
        angle: 90,
        spread: 80,
        origin: { x: 0.5, y: 0 },
        colors: CONFETTI_COLORS,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  } catch {
    // confetti is celebratory only
  }
}

const SPOTLIGHT_PAD = 10;

/** First-visit spotlight walkthrough for the Report Mode dock. */
export function ReportModeTutorial({
  active,
  stepIndex,
  onNext,
  onSkip,
  onComplete,
}: ReportModeTutorialProps) {
  const step = REPORT_TUTORIAL_STEPS[stepIndex];
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!active || !step) {
      setSpotlight(null);
      return;
    }
    const el = findTutorialTarget(step.id);
    setSpotlight(el?.getBoundingClientRect() ?? null);
  }, [active, step]);

  useEffect(() => {
    if (!active || !step) {
      return;
    }

    measure();
    const target = findTutorialTarget(step.id);
    const observer = target ? new ResizeObserver(measure) : null;
    if (target && observer) {
      observer.observe(target);
    }

    let frame = 0;
    let frames = 0;
    const tick = () => {
      measure();
      frames += 1;
      if (frames < 120) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, measure, step]);

  if (!active || !step) {
    return null;
  }

  const isLast = stepIndex >= REPORT_TUTORIAL_STEPS.length - 1;

  async function handleDone() {
    await fireCelebrationConfetti();
    onComplete();
  }

  const spotlightStyle = spotlight
    ? {
        top: spotlight.top - SPOTLIGHT_PAD,
        left: spotlight.left - SPOTLIGHT_PAD,
        width: spotlight.width + SPOTLIGHT_PAD * 2,
        height: spotlight.height + SPOTLIGHT_PAD * 2,
      }
    : null;

  return (
    <div
      className="report-mode-tutorial"
      data-report-mode-ui={true}
      data-testid="report-mode-tutorial"
    >
      {spotlightStyle ? (
        <>
          <div className="report-mode-tutorial-hole" style={spotlightStyle} />
          <div className="report-mode-tutorial-ring" style={spotlightStyle} />
        </>
      ) : null}

      <div className="report-mode-tutorial-card">
        <p className="report-mode-tutorial-step">
          Step {stepIndex + 1} of {REPORT_TUTORIAL_STEPS.length}
        </p>
        <h3 className="report-mode-tutorial-title">{step.title}</h3>
        <p className="report-mode-tutorial-body">{step.body}</p>
        <div className="report-mode-tutorial-actions">
          <button className="report-mode-tutorial-skip" onClick={onSkip} type="button">
            Skip
          </button>
          <button
            className={cn('report-mode-tutorial-next')}
            data-testid="report-mode-tutorial-next"
            onClick={() => void (isLast ? handleDone() : onNext())}
            type="button"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { REPORT_TUTORIAL_STEPS };
