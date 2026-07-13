import { scrubSecrets } from './secretScrub';
import type { Journey, JourneyStep, JourneyToolEvent } from './types';

const hintsMatch = (toolName: string, hints: readonly string[]): boolean => {
  const lower = toolName.toLowerCase();
  return hints.some((hint) => lower.includes(hint.toLowerCase()));
};

/**
 * Find the best step for a tool event: first running step that matches, else first pending match.
 *
 * @param journey - Current journey.
 * @param toolName - Agent tool name.
 * @returns Step id or null.
 * @example
 * findStepForTool(journey, 'mcp__browser__navigate');
 */
export const findStepForTool = (journey: Journey, toolName: string): string | null => {
  const running = journey.steps.find(
    (s) => s.status === 'running' && hintsMatch(toolName, s.toolHints),
  );
  if (running) {
    return running.id;
  }
  const pending = journey.steps.find(
    (s) => s.status === 'pending' && hintsMatch(toolName, s.toolHints),
  );
  return pending === undefined ? null : pending.id;
};

const mapStep = (
  steps: readonly JourneyStep[],
  stepId: string,
  status: JourneyStep['status'],
): readonly JourneyStep[] => steps.map((s) => (s.id === stepId ? { ...s, status } : s));

/**
 * Apply a tool event to a journey. Agent events win on status.
 * Detail text is secret-scrubbed before storage on the journey (not currently stored; scrubbed for callers).
 *
 * @param journey - Current journey.
 * @param event - Tool start/end/error.
 * @returns Updated journey (or same reference if no match).
 * @example
 * applyToolEvent(journey, { name: 'oauth.google', phase: 'start' });
 */
export const applyToolEvent = (journey: Journey, event: JourneyToolEvent): Journey => {
  if (event.detail !== undefined) {
    // Force scrub path so callers never keep raw secrets beside journeys
    scrubSecrets(event.detail);
  }

  const stepId = findStepForTool(journey, event.name);
  if (stepId === null) {
    // No hint match: start the first pending step on start, complete running on end
    if (event.phase === 'start') {
      const firstPending = journey.steps.find((s) => s.status === 'pending');
      if (!firstPending) {
        return journey;
      }
      return { ...journey, steps: mapStep(journey.steps, firstPending.id, 'running') };
    }
    if (event.phase === 'end') {
      const running = journey.steps.find((s) => s.status === 'running');
      if (!running) {
        return journey;
      }
      return { ...journey, steps: mapStep(journey.steps, running.id, 'done') };
    }
    if (event.phase === 'error') {
      const running = journey.steps.find((s) => s.status === 'running');
      if (!running) {
        return journey;
      }
      return { ...journey, steps: mapStep(journey.steps, running.id, 'error') };
    }
    return journey;
  }

  if (event.phase === 'start') {
    return { ...journey, steps: mapStep(journey.steps, stepId, 'running') };
  }
  if (event.phase === 'error') {
    return { ...journey, steps: mapStep(journey.steps, stepId, 'error') };
  }
  return { ...journey, steps: mapStep(journey.steps, stepId, 'done') };
};

/**
 * Apply a sequence of tool events (fixtures or replayed agent stream).
 *
 * @param journey - Starting journey.
 * @param events - Ordered tool events.
 * @returns Final journey state.
 * @example
 * applyToolEvents(journey, fixtureToolEvents(journey));
 */
export const applyToolEvents = (journey: Journey, events: readonly JourneyToolEvent[]): Journey =>
  events.reduce((acc, event) => applyToolEvent(acc, event), journey);
