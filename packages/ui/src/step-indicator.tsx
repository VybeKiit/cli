'use client';

import type { ReactNode } from 'react';
import { Spinner } from './spinner';
import { cn } from './utils';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

type Step = {
  id: string;
  label: string;
  status: StepStatus;
};

type StepIndicatorProps = {
  steps: Step[];
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md';
  className?: string;
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8.5l3.5 3.5 6.5-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3" fill="currentColor" />
  </svg>
);

const StatusDot = ({ status, size }: { status: StepStatus; size: 'sm' | 'md' }) => {
  const dotSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const dots = {
    done: (
      <div
        className={cn('flex items-center justify-center rounded-full bg-emerald-500/20', dotSize)}
      >
        <CheckIcon className={cn('text-emerald-400', iconSize)} />
      </div>
    ),
    running: (
      <div
        className={cn('flex items-center justify-center rounded-full bg-purple-500/20', dotSize)}
      >
        <Spinner className={cn('text-purple-400', iconSize)} />
      </div>
    ),
    error: (
      <div className={cn('flex items-center justify-center rounded-full bg-red-500/20', dotSize)}>
        <CircleIcon className={cn('text-red-400', iconSize)} />
      </div>
    ),
    pending: (
      <div className={cn('flex items-center justify-center rounded-full bg-zinc-800', dotSize)}>
        <CircleIcon className={cn('text-zinc-600', iconSize)} />
      </div>
    ),
  } satisfies Record<StepStatus, ReactNode>;

  return dots[status];
};

/**
 * Animated step progress indicator. Vertical or horizontal.
 * Perfect for onboarding flows, build pipelines, and task sequences.
 *
 * @param props - Step list, orientation, size, and optional class names.
 * @returns The rendered step progress indicator.
 * @example
 * <StepIndicator steps={[{ id: 'install', label: 'Install', status: 'done' }]} />;
 */
export const StepIndicator = ({
  steps,
  orientation = 'vertical',
  size = 'md',
  className,
}: StepIndicatorProps) => {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <StatusDot status={step.status} size={size} />
              <span
                className={cn(
                  'text-center',
                  size === 'sm' ? 'text-xs' : 'text-xs',
                  step.status === 'done'
                    ? 'text-emerald-400'
                    : step.status === 'running'
                      ? 'text-purple-400'
                      : 'text-zinc-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 min-w-[20px]',
                  step.status === 'done' ? 'bg-emerald-500/40' : 'bg-zinc-800',
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <StatusDot status={step.status} size={size} />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-px flex-1 min-h-[20px]',
                  step.status === 'done' ? 'bg-emerald-500/40' : 'bg-zinc-800',
                )}
              />
            )}
          </div>
          <div className="pb-4">
            <span
              className={cn(
                size === 'sm' ? 'text-xs' : 'text-sm',
                step.status === 'done'
                  ? 'text-emerald-400'
                  : step.status === 'running'
                    ? 'text-purple-400 font-medium'
                    : 'text-zinc-500',
              )}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
