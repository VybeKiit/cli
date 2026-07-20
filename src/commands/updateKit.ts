import process from 'node:process';
import { planUpdateKitPipeline } from '@vybekiit/agent-kit';
import { Effect } from 'effect';
import { runSyncAgentLayer } from './syncAgentLayer';

export type UpdateKitCommandResult = {
  readonly exitCode: number;
  readonly lines: readonly string[];
};

/**
 * Plan (and optionally apply channel 2) the three-channel update-kit pipeline.
 *
 * Channel 1 (kit workspace / mirror pull) is agent-guided: the CLI prints the
 * next step rather than force-pulling a buyer's working tree.
 * Channel 2 runs `sync-agent-layer` when `--apply` is passed.
 * Channel 3 prints the platform-skills update command.
 *
 * @param args - CLI args (`--apply` applies agent-layer sync).
 * @returns Exit code and stdout lines.
 */
export const runUpdateKit = async (
  args: readonly string[] = [],
): Promise<UpdateKitCommandResult> => {
  const apply = args.includes('--apply');
  // Heuristic staleness for CLI: without a full workspace probe, assume agent layer
  // may need refresh when apply is requested; kit + skills always report the path.
  const plan = await Effect.runPromise(
    planUpdateKitPipeline({
      kitWorkspaceStale: true,
      agentLayerStale: apply || args.includes('--check-agent-layer'),
      platformSkillsStale: true,
    }),
  );

  const lines: string[] = ['Update kit plan (ADR-0033 three channels):'];
  for (const channel of plan.channels) {
    lines.push(`  [${channel.channel}] ${channel.summary}`);
  }

  if (apply) {
    const sync = await runSyncAgentLayer([]);
    lines.push(...sync.lines);
    lines.push('Next: pull the gated kit line if packages changed, then run: npx skills update -y');
    return { exitCode: sync.exitCode, lines };
  }

  lines.push('Run with --apply to sync the agent layer now.');
  lines.push('Or let your coding agent run the update-kit skill (Decide + Guide).');
  return { exitCode: 0, lines };
};

/**
 * Write update-kit lines to stdout and return the exit code.
 *
 * @param args - CLI args.
 * @returns Process exit code.
 * @example
 * const code = await runUpdateKitCommand(process.argv.slice(3));
 */
export const runUpdateKitCommand = async (args: readonly string[]): Promise<number> => {
  const result = await runUpdateKit(args);
  for (const line of result.lines) {
    process.stdout.write(`${line}\n`);
  }
  return result.exitCode;
};
