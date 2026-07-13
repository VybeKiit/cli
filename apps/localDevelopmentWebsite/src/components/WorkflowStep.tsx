'use client';

import { ProviderMark } from '@vybekiit/ui';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowStep } from '@/lib/workflows';
import { CodeSnippets } from './CodeSnippets';
import { STEP_ICONS } from './WorkflowIcons';

type WorkflowStepItemProps = {
  step: WorkflowStep;
  index: number;
  compact?: boolean;
};

const StatusIndicator = ({ status }: { status: WorkflowStep['status'] }) => {
  switch (status) {
    case 'done':
      return (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    case 'running':
      return (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
          <Loader2 className="h-3 w-3 animate-spin text-violet-600 dark:text-violet-400" />
        </div>
      );
    default:
      return (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
          <Circle className="h-3 w-3 text-muted-foreground" />
        </div>
      );
  }
};

const StepIcon = ({ stepId, className }: { stepId: string; className?: string }) => {
  const Icon = STEP_ICONS[stepId];
  if (!Icon) return null;
  return <Icon className={cn('h-5 w-5 shrink-0', className)} />;
};

const GoLiveDot = ({ status }: { status: WorkflowStep['status'] }) => (
  <div
    className={cn(
      'go-live-dot',
      status === 'done' || status === 'running' ? 'go-live-dot--active' : 'go-live-dot--pending',
    )}
  />
);

const containerClass = (status: WorkflowStep['status'], isDeploy: boolean, isActive: boolean) => {
  if (isDeploy && status === 'running') {
    return 'border-emerald-500/40 bg-emerald-500/10';
  }
  if (isDeploy && isActive) {
    return 'border-emerald-500/40 bg-emerald-500/10';
  }
  if (isDeploy && status === 'pending') {
    return 'border-orange-500/30 bg-orange-500/5';
  }
  if (status === 'running') {
    return 'border-violet-500/40 bg-violet-500/10 shadow-[0_0_16px_rgba(139,92,246,0.08)]';
  }
  if (status === 'done') {
    return 'border-emerald-500/30 bg-emerald-500/10';
  }
  // Pending: solid card surface so labels stay high-contrast in light + dark.
  return 'border-border bg-muted/60';
};

const stepIconColor = (status: WorkflowStep['status'], isDeploy: boolean) => {
  if (status === 'done') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'running') {
    return isDeploy
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-violet-600 dark:text-violet-400';
  }
  return 'text-muted-foreground';
};

const subIconColor = (status: WorkflowStep['status']) => {
  if (status === 'done') return 'text-emerald-600 dark:text-emerald-400';
  if (status === 'running') return 'text-violet-600 dark:text-violet-400';
  return 'text-muted-foreground';
};

/**
 * Render the workflow step item component.
 *
 * @param step - Workflow step to render.
 * @param index - Step position used for staggered animation.
 * @param compact - Whether to render the smaller step layout.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <WorkflowStepItem step={step} index={0} compact={true} />;
 */
export const WorkflowStepItem = ({ step, index, compact = false }: WorkflowStepItemProps) => {
  const hasIcon = !!STEP_ICONS[step.id];
  const isActive = step.status === 'running' || step.status === 'done';
  const isDeploy = step.id === 'deploy' || step.id === 'go-live' || step.id === 'deploy-live';
  const isScaffold = step.id === 'scaffold';
  const hasBrand = Boolean(step.provider) || Boolean(step.domain);
  const brandActive = step.status === 'done';
  const brandRunning = step.status === 'running';

  return (
    <motion.div
      data-status={step.status}
      data-testid={`workflow-step-${step.id}`}
      data-provider={step.provider ?? ''}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden rounded-xl border transition',
        containerClass(step.status, isDeploy, isActive),
        compact ? 'p-2.5' : 'p-4',
      )}
    >
      {isDeploy && step.status === 'running' && (
        <div className="deploy-wave pointer-events-none absolute inset-0" />
      )}

      <div className="relative flex items-center gap-3">
        {isDeploy ? <GoLiveDot status={step.status} /> : <StatusIndicator status={step.status} />}

        {hasIcon && !isDeploy && !hasBrand && (
          <StepIcon stepId={step.id} className={stepIconColor(step.status, isDeploy)} />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold leading-snug text-foreground',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {step.label}
          </p>
          {!compact && step.description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          ) : null}
        </div>

        {hasBrand ? (
          <ProviderMark
            {...(step.provider === undefined ? {} : { provider: step.provider })}
            {...(step.domain === undefined ? {} : { domain: step.domain })}
            active={brandActive}
            running={brandRunning}
            size={compact ? 22 : 28}
            showLabel={!compact && (brandActive || brandRunning)}
            className="shrink-0"
          />
        ) : null}
      </div>

      {isScaffold && step.status === 'running' && (
        <CodeSnippets active={step.status === 'running'} />
      )}

      {step.subSteps && step.subSteps.length > 0 && (
        <div
          className={cn(
            'mt-3 ml-2.5 space-y-2 border-l-2 border-border pl-4',
            compact && 'mt-2 space-y-1.5',
          )}
        >
          {step.subSteps.map((sub) => {
            const subHasIcon = !!STEP_ICONS[sub.id];
            return (
              <div key={sub.id} className="flex items-center gap-2.5">
                <StatusIndicator status={sub.status} />
                {subHasIcon && (
                  <StepIcon stepId={sub.id} className={cn('h-4 w-4', subIconColor(sub.status))} />
                )}
                <span
                  className={cn('font-medium text-foreground/90', compact ? 'text-xs' : 'text-xs')}
                >
                  {sub.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
