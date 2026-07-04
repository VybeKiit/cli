'use client';

import type { WalkthroughStep } from '@vybekiit/walkthrough';
import { useMemo } from 'react';
import {
  REPORT_TUTORIAL_STEPS,
  type ReportTutorialStepId,
} from '@/components/report-mode/shared/report-mode-copy';
import { Walkthrough } from '@/components/walkthrough';

type ReportModeTutorialProps = {
  readonly active: boolean;
  readonly stepIndex: number;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly onComplete: () => void;
};

function targetSelector(stepId: ReportTutorialStepId): string {
  return `[data-report-tutorial="${stepId}"]`;
}

/** First-visit spotlight walkthrough for the Report Mode dock — a thin @vybekiit/walkthrough consumer. */
export function ReportModeTutorial({
  active,
  stepIndex,
  onNext,
  onSkip,
  onComplete,
}: ReportModeTutorialProps) {
  const steps = useMemo<readonly WalkthroughStep[]>(
    () =>
      REPORT_TUTORIAL_STEPS.map((step) => ({
        id: step.id,
        title: step.title,
        body: step.body,
        target: targetSelector(step.id),
      })),
    [],
  );

  return (
    <Walkthrough
      celebrate={true}
      state={{
        active,
        stepIndex,
        next: onNext,
        back: () => undefined,
        skip: onSkip,
        complete: onComplete,
        replay: () => undefined,
      }}
      steps={steps}
      variant="spotlight"
    />
  );
}

export { REPORT_TUTORIAL_STEPS };
