'use client';

import type { WalkthroughStep } from '@vybekiit/walkthrough';
import { useMemo } from 'react';
import {
  REPORT_TUTORIAL_STEPS,
  type ReportTutorialStepId,
} from '@/components/report-mode/shared/report-mode-copy';
import { Walkthrough } from '@/components/walkthrough';

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
 * Render the first-visit spotlight walkthrough for the Report Mode dock.
 *
 * @param props - Current tutorial state and navigation callbacks.
 * @returns A walkthrough instance pointed at report-mode controls.
 * @example
 * <ReportModeTutorial active={true} stepIndex={0} onNext={next} onSkip={skip} onComplete={complete} />
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
