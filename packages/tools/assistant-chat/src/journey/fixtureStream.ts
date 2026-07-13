import type { BridgeEventPayload } from '../protocol';
import type { Journey, JourneyToolEvent } from './types';

/**
 * Build ordered tool events that walk every step start→end for CI / offline demos.
 * Never includes secrets.
 *
 * @param journey - Seeded journey.
 * @returns Tool events that fully complete the journey when applied.
 * @example
 * fixtureToolEvents(seedJourney('auth', { provider: 'google' }));
 */
export const fixtureToolEvents = (journey: Journey): readonly JourneyToolEvent[] => {
  const events: JourneyToolEvent[] = [];
  for (const step of journey.steps) {
    const hint = step.toolHints[0] ?? step.id;
    const name = `fixture.${journey.domain}.${hint}`;
    events.push({ name, phase: 'start', detail: step.label });
    events.push({ name, phase: 'end', detail: `${step.label} done` });
  }
  return events;
};

/**
 * Bridge-shaped fixture stream (status + tool_call + tokens + done) for EventSource tests.
 *
 * @param journey - Seeded journey.
 * @returns Bridge events safe for UI consumption.
 * @example
 * fixtureBridgeEvents(journey).forEach(serializeBridgeEvent);
 */
export const fixtureBridgeEvents = (journey: Journey): readonly BridgeEventPayload[] => {
  const events: BridgeEventPayload[] = [
    { type: 'status', state: 'starting' },
    { type: 'status', state: 'streaming' },
    {
      type: 'token',
      text: `On it — starting “${journey.title}” (${journey.skillIntent}).`,
    },
  ];

  for (const tool of fixtureToolEvents(journey)) {
    events.push({
      type: 'tool_call',
      name: tool.name,
      detail: tool.detail,
    });
    if (tool.phase === 'end') {
      events.push({
        type: 'token',
        text: `\n✓ ${tool.detail ?? tool.name}`,
      });
    }
  }

  events.push({ type: 'status', state: 'idle' });
  events.push({ type: 'done', exitCode: 0 });
  return events;
};
