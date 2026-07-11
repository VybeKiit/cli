import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { planUpdateKitPipeline } from './updateKitPipeline';

describe('planUpdateKitPipeline', () => {
  it('marks upToDate when no channel is stale', async () => {
    const plan = await Effect.runPromise(
      planUpdateKitPipeline({
        kitWorkspaceStale: false,
        agentLayerStale: false,
        platformSkillsStale: false,
      }),
    );
    expect(plan.upToDate).toBe(true);
    expect(plan.channels.every((channel) => !channel.needed)).toBe(true);
  });

  it('lists needed channels when stale', async () => {
    const plan = await Effect.runPromise(
      planUpdateKitPipeline({
        kitWorkspaceStale: true,
        agentLayerStale: false,
        platformSkillsStale: true,
      }),
    );
    expect(plan.upToDate).toBe(false);
    expect(plan.channels.filter((channel) => channel.needed).map((c) => c.channel)).toEqual([
      'kit-workspace',
      'platform-skills',
    ]);
  });
});
