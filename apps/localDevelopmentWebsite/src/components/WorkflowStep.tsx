'use client';

import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowStep } from '@/lib/workflows';
import { CodeSnippets } from './CodeSnippets';
import { DatabaseLogos } from './DatabaseLogos';
import { DeployLogos } from './DeployLogos';
import { PaymentLogos } from './PaymentLogos';
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
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-3 w-3 text-emerald-400" />
        </div>
      );
    case 'running':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-vybe-500/20">
          <Loader2 className="h-3 w-3 animate-spin text-vybe-400" />
        </div>
      );
    default:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800">
          <Circle className="h-3 w-3 text-zinc-600" />
        </div>
      );
  }
};

const StepIcon = ({ stepId, className }: { stepId: string; className?: string }) => {
  const Icon = STEP_ICONS[stepId];
  if (!Icon) return null;
  return <Icon className={cn('h-5 w-5', className)} />;
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
  if (isDeploy && status === 'running') return 'border-emerald-500/30 bg-emerald-950/10';
  if (isDeploy && isActive) return 'border-emerald-500/30 bg-emerald-950/10';
  if (isDeploy && status === 'pending') return 'border-orange-500/20 bg-orange-950/5';
  if (status === 'running')
    return 'border-vybe-500/30 bg-vybe-950/20 shadow-[0_0_16px_rgba(139,92,246,0.08)]';
  if (status === 'done') return 'border-emerald-500/20 bg-emerald-950/10';
  return 'border-zinc-800 bg-zinc-900/40';
};

const stepIconColor = (status: WorkflowStep['status'], isDeploy: boolean) => {
  if (status === 'done') return 'text-emerald-400';
  if (status === 'running') return isDeploy ? 'text-emerald-400' : 'text-vybe-400';
  return 'text-zinc-500';
};

const subIconColor = (status: WorkflowStep['status']) => {
  if (status === 'done') return 'text-emerald-400';
  if (status === 'running') return 'text-vybe-400';
  return 'text-zinc-500';
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
  const isDatabase = step.id === 'database';
  const isPayment = step.id === 'payment';
  const isScaffold = step.id === 'scaffold';

  return (
    <motion.div
      data-status={step.status}
      data-testid={`workflow-step-${step.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative rounded-xl border transition overflow-hidden',
        containerClass(step.status, isDeploy, isActive),
        compact ? 'p-2.5' : 'p-4',
      )}
    >
      {isDeploy && step.status === 'running' && (
        <div className="deploy-wave absolute inset-0 pointer-events-none" />
      )}

      <div className="relative flex items-center gap-3">
        {isDeploy ? <GoLiveDot status={step.status} /> : <StatusIndicator status={step.status} />}

        {hasIcon && !isDeploy && (
          <StepIcon stepId={step.id} className={stepIconColor(step.status, isDeploy)} />
        )}

        <div className="min-w-0 flex-1">
          <p className={cn('font-medium text-zinc-100', compact ? 'text-xs' : 'text-sm')}>
            {step.label}
          </p>
          {!compact && step.description && (
            <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
          )}
        </div>
      </div>

      {isDatabase && <DatabaseLogos active={isActive} />}

      {isPayment && <PaymentLogos active={isActive} />}

      {isDeploy && <DeployLogos active={isActive} />}

      {isScaffold && step.status === 'running' && (
        <CodeSnippets active={step.status === 'running'} />
      )}

      {step.subSteps && step.subSteps.length > 0 && (
        <div
          className={cn(
            'mt-3 space-y-2 border-l-2 border-zinc-800/60 pl-4 ml-2.5',
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
                <span className={cn('text-zinc-300', compact ? 'text-xs' : 'text-xs')}>
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
