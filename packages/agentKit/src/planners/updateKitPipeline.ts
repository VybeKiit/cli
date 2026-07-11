import { Data, Effect } from 'effect';

/**
 * Three-channel kit update plan (ADR-0033 / CONTEXT.md).
 *
 * Channel 1 is gated kit/workspace refresh (mirror pull), not public npm bumps.
 * Channel 2 is agent-layer sync. Channel 3 is platform skills update.
 */
export type UpdateKitChannel = 'kit-workspace' | 'agent-layer' | 'platform-skills';

/** One planned channel action. */
export type UpdateKitChannelPlan = {
  readonly channel: UpdateKitChannel;
  readonly needed: boolean;
  readonly summary: string;
};

/** Full update-kit plan across all three channels. */
export type UpdateKitPipelinePlan = {
  readonly channels: readonly UpdateKitChannelPlan[];
  readonly upToDate: boolean;
};

/** Expected pipeline planning failure. */
export class UpdateKitPipelineError extends Data.TaggedError('UpdateKitPipelineError')<{
  readonly code: 'plan_failed';
  readonly message: string;
}> {}

/** Injectable inputs for planning (tests + CLI). */
export type UpdateKitPipelineInput = {
  /** Whether the kit workspace / mirror needs a pull. */
  readonly kitWorkspaceStale: boolean;
  /** Whether agent-layer allowlisted paths differ from source. */
  readonly agentLayerStale: boolean;
  /** Whether platform skills lock reports updates available. */
  readonly platformSkillsStale: boolean;
};

/**
 * Plan the three-channel update-kit pipeline without applying side effects.
 *
 * @param input - Staleness flags per channel.
 * @returns Effect with the ordered channel plan.
 * @example
 * const plan = await Effect.runPromise(planUpdateKitPipeline({
 *   kitWorkspaceStale: true,
 *   agentLayerStale: false,
 *   platformSkillsStale: true,
 * }));
 */
export const planUpdateKitPipeline = (
  input: UpdateKitPipelineInput,
): Effect.Effect<UpdateKitPipelinePlan, UpdateKitPipelineError> =>
  Effect.succeed({
    channels: [
      {
        channel: 'kit-workspace' as const,
        needed: input.kitWorkspaceStale,
        summary: input.kitWorkspaceStale
          ? 'Pull the latest gated kit workspace (mirror / kit line).'
          : 'Kit workspace is current.',
      },
      {
        channel: 'agent-layer' as const,
        needed: input.agentLayerStale,
        summary: input.agentLayerStale
          ? 'Refresh agent-layer instructions (sync-agent-layer).'
          : 'Agent layer is current.',
      },
      {
        channel: 'platform-skills' as const,
        needed: input.platformSkillsStale,
        summary: input.platformSkillsStale
          ? 'Update pinned platform skills (skills CLI).'
          : 'Platform skills are current.',
      },
    ],
    upToDate: !(input.kitWorkspaceStale || input.agentLayerStale || input.platformSkillsStale),
  });
