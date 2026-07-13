import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORE_KEYS } from '@/lib/keys';
import type { Workflow, WorkflowStep, WorkflowStepStatus } from '@/lib/workflows';

type WorkflowState = {
  workflow: Workflow | null;
  isRunning: boolean;
  setWorkflow: (workflow: Workflow) => void;
  markStepRunning: (stepId: string) => void;
  markStepDone: (stepId: string) => void;
  reset: (workflow: Workflow) => void;
  /** Drop the active workflow so the board hides until the next user request. */
  clearWorkflow: () => void;
  setRunning: (running: boolean) => void;
};

const updateStepStatus = (
  step: WorkflowStep,
  stepId: string,
  status: WorkflowStepStatus,
): WorkflowStep => {
  if (step.id === stepId) return { ...step, status };
  if (!step.subSteps) return step;

  const nextSubs = step.subSteps.map((sub) => (sub.id === stepId ? { ...sub, status } : sub));
  let parentStatus: WorkflowStepStatus = step.status;
  if (nextSubs.every((sub) => sub.status === 'done')) parentStatus = 'done';
  else if (step.status === 'pending') parentStatus = 'running';

  return { ...step, status: parentStatus, subSteps: nextSubs };
};

const resetStep = (step: WorkflowStep): WorkflowStep => ({
  ...step,
  status: 'pending',
  ...(step.subSteps
    ? { subSteps: step.subSteps.map((sub) => ({ ...sub, status: 'pending' as const })) }
    : {}),
});

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      workflow: null,
      isRunning: false,

      setWorkflow: (workflow) => set({ workflow }),

      markStepRunning: (stepId) => {
        set((s) => {
          if (!s.workflow) return s;
          return {
            workflow: {
              ...s.workflow,
              steps: s.workflow.steps.map((step) => updateStepStatus(step, stepId, 'running')),
            },
          };
        });
      },

      markStepDone: (stepId) => {
        set((s) => {
          if (!s.workflow) return s;
          return {
            workflow: {
              ...s.workflow,
              steps: s.workflow.steps.map((step) => updateStepStatus(step, stepId, 'done')),
            },
          };
        });
      },

      reset: (workflow) => {
        set({ workflow: { ...workflow, steps: workflow.steps.map(resetStep) }, isRunning: false });
      },

      clearWorkflow: () => set({ workflow: null, isRunning: false }),

      setRunning: (running) => set({ isRunning: running }),
    }),
    // v2: do not rehydrate the old always-on default SaaS board.
    { name: `${STORE_KEYS.workflow}:v2` },
  ),
);
