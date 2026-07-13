'use client';

import { Button, Progress } from '@vybekiit/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LandingPreview } from '@/components/LandingPreview';
import { WorkflowStepItem } from '@/components/WorkflowStep';
import { celebrate } from '@/lib/confetti';
import { cn } from '@/lib/utils';
import { detectWorkflow } from '@/lib/workflowDetection';
import { useChatStore, useWorkflowStore } from '@/stores';

type WorkflowRunnerProps = {
  compact?: boolean;
};

/**
 * Render the workflow runner only after a user message seeds a workflow.
 * Idle chat stays clean — no hardcoded SaaS board.
 *
 * @param compact - Whether to render the smaller workflow layout.
 * @returns A React element for the local dev Console UI, or null when idle.
 * @example
 * const element = <WorkflowRunner compact={true} />;
 */
export const WorkflowRunner = ({ compact = false }: WorkflowRunnerProps) => {
  const workflow = useWorkflowStore((s) => s.workflow);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);
  const setRunning = useWorkflowStore((s) => s.setRunning);
  const conversations = useChatStore((s) => s.conversations);

  const [collapsed, setCollapsed] = useState(false);

  // Seed only from the latest user message — never auto-fill a default board.
  useEffect(() => {
    if (isRunning || !conversations.length) return;

    const latest = conversations[0];
    if (!latest) return;

    const lastUserMsg = [...latest.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    const detected = detectWorkflow(lastUserMsg.content);
    if (detected && detected.steps.length > 0) {
      setWorkflow(detected);
      setCollapsed(false);
    }
  }, [conversations, isRunning, setWorkflow]);

  const allStepsDone =
    workflow === null ? false : workflow.steps.every((step) => step.status === 'done');
  const prevAllDone = useRef(allStepsDone);

  useEffect(() => {
    if (allStepsDone && !prevAllDone.current) {
      celebrate();
      toast.success('Workflow complete.');
      setRunning(false);
      setCollapsed(true);
    }
    prevAllDone.current = allStepsDone;
  }, [allStepsDone, setRunning]);

  const resetWorkflow = useCallback(() => {
    clearWorkflow();
    setCollapsed(false);
    toast.message('Workflow cleared.');
  }, [clearWorkflow]);

  if (!workflow) return null;

  const allSteps = workflow.steps.flatMap((step) => {
    const subSteps =
      step.subSteps === undefined
        ? []
        : step.subSteps.map((sub) => ({ id: sub.id, status: sub.status }));
    return [{ id: step.id, status: step.status }, ...subSteps];
  });
  const doneCount = allSteps.filter((s) => s.status === 'done').length;
  const progress = allSteps.length > 0 ? (doneCount / allSteps.length) * 100 : 0;

  return (
    <section
      data-testid="workflow-board"
      className={cn(
        'mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5',
        compact && 'p-3',
      )}
    >
      <div className={cn('space-y-4', compact && 'space-y-3')}>
        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
            compact && 'gap-2',
          )}
        >
          <div className="flex items-center gap-2">
            {allStepsDone && (
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={collapsed ? 'Expand workflow' : 'Collapse workflow'}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
            <div>
              <h2
                data-testid="workflow-title"
                className={cn(
                  'font-bold tracking-tight text-foreground',
                  compact ? 'text-base' : 'text-xl',
                )}
              >
                {workflow.title}
              </h2>
              {!compact && (
                <p className="mt-0.5 text-xs text-muted-foreground">{workflow.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetWorkflow}
              disabled={isRunning}
              className="border-border bg-background text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {!compact && <span>Reset</span>}
            </Button>
          </div>
        </div>

        {(isRunning || progress > 0) && (
          <Progress
            value={progress}
            className="h-1.5 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-vybe-600 [&>div]:to-emerald-500"
          />
        )}

        {allStepsDone && collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-left text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-400"
          >
            All {allSteps.length} steps complete — click to expand
          </button>
        )}

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className={cn('space-y-2.5', compact && 'space-y-2')}>
                {workflow.steps.map((step, index) => (
                  <WorkflowStepItem key={step.id} step={step} index={index} compact={compact} />
                ))}
              </div>

              {allStepsDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4"
                >
                  <LandingPreview title={workflow.title} compact={compact} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
