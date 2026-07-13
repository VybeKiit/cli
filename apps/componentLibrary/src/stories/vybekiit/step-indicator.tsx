'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { StepIndicator } from '@vybekiit/ui/step-indicator';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

const ONBOARDING_STEPS: { id: string; label: string; status: StepStatus }[] = [
  { id: 'account', label: 'Create account', status: 'done' },
  { id: 'project', label: 'Create project', status: 'done' },
  { id: 'db', label: 'Connect database', status: 'running' },
  { id: 'deploy', label: 'Deploy to production', status: 'pending' },
];

const BUILD_STEPS: { id: string; label: string; status: StepStatus }[] = [
  { id: 'install', label: 'Install dependencies', status: 'done' },
  { id: 'lint', label: 'Lint & type-check', status: 'done' },
  { id: 'test', label: 'Run test suite', status: 'done' },
  { id: 'build', label: 'Build artefacts', status: 'done' },
];

const ERROR_STEPS: { id: string; label: string; status: StepStatus }[] = [
  { id: 'connect', label: 'Connect to registry', status: 'done' },
  { id: 'pull', label: 'Pull base image', status: 'error' },
  { id: 'push', label: 'Push to container registry', status: 'pending' },
  { id: 'deploy', label: 'Deploy container', status: 'pending' },
];

/** StepIndicator: vertical md, vertical sm, horizontal, and error variants. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-lg space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          vertical / md — step 3 running
        </p>
        <StepIndicator steps={ONBOARDING_STEPS} orientation="vertical" size="md" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          vertical / sm — all steps done
        </p>
        <StepIndicator steps={BUILD_STEPS} orientation="vertical" size="sm" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          horizontal / md — step 2 running (onboarding)
        </p>
        <StepIndicator steps={ONBOARDING_STEPS} orientation="horizontal" size="md" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          vertical / md — step with error
        </p>
        <StepIndicator steps={ERROR_STEPS} orientation="vertical" size="md" />
      </div>
    </div>
  ),
};

export default story;
