'use client';

import type { WalkthroughStep } from '@vybekiit/walkthrough';
import { Walkthrough } from '@vybekiit-template-web/components/walkthrough';
import { useMemo } from 'react';
import {
  REPORT_TUTORIAL_STEPS,
  type ReportTutorialStepId,
} from '@/components/report-mode/shared/report-mode-copy';

interface ReportModeTutorialProps {
  readonly active: boolean;
  readonly stepIndex: number;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly onComplete: () => void;
}

const targetSelector = (stepId: ReportTutorialStepId): string =>
  `[data-report-tutorial="${stepId}"]`;

/**
 * First-visit spotlight walkthrough for the Report Mode dock — a thin @vybekiit/walkthrough consumer.
 *
 * @param props - Component props.
 * @returns The rendered ReportModeTutorial element.
 * @example
 * ```tsx
 * <ReportModeTutorial />
 * ```
 */

export const ReportModeTutorial = ({
  active,
  stepIndex,
  onNext,
  onSkip,
  onComplete,
}: ReportModeTutorialProps) => {
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
};
