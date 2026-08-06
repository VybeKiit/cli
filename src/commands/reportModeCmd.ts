import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import { inferVybeAssistant } from '@vybekiit/report-mode';
import { selectedAppSurface } from '../lib/appSurface';
import { inferProjectSurfaceSync } from '../lib/inferProjectSurface';
import { locateKitWorkspace } from '../lib/kitWorkspaceSource';
import { absoluteInstallDest } from '../lib/pageRecipeInstall';
import {
  applyReportModeInstall,
  type InstallableReportModePlan,
  planReportModeInstall,
} from '../lib/reportModeInstall';
import { parsePieceFlags } from './pieceFlags';

type CommandResult = {
  readonly json: string;
  readonly exitCode: number;
};

/**
 * Detect a Cursor session from its env markers (mirrors the doctor's probe).
 *
 * @returns True when Cursor session env markers are present.
 */
const isCursorSession = (): boolean =>
  Boolean(process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID);

/**
 * Probe whether a command exits successfully (mirrors the doctor's `succeeds`).
 *
 * @param command - Executable to run.
 * @param args - Arguments passed to the executable.
 * @returns True when the command exits with status zero.
 */
const succeeds = (command: string, args: readonly string[]): boolean =>
  spawnSync(command, [...args], { stdio: 'ignore' }).status === 0;

/**
 * Resolve which assistant Report Mode should hand off to, reusing the SSOT inference the
 * doctor uses. Returns `null` when none are detected (the gate is written; doctor fills the
 * assistant key later).
 *
 * @returns Assistant id, or `null`.
 */
const detectedAssistantId = (): string | null =>
  inferVybeAssistant({
    cursorSession: isCursorSession(),
    claudeInstalled: succeeds('claude', ['--version']),
    codexInstalled: succeeds('codex', ['--version']),
  });

/**
 * Serialize an install plan + outcome for agent consumption.
 *
 * @param plan - Installable plan.
 * @param written - Paths written (empty on dry-run).
 * @param skipped - Paths skipped because they already existed.
 * @param dryRun - Whether this was a dry run.
 * @returns JSON-serializable payload.
 */
const installPayload = (
  plan: InstallableReportModePlan,
  written: readonly string[],
  skipped: readonly string[],
  dryRun: boolean,
): Record<string, unknown> => ({
  ok: true,
  dryRun,
  surface: plan.surface,
  files: plan.files.map((file) => file.relativePath),
  written,
  skipped,
  deps: plan.deps,
  env: plan.env,
  mount: { status: plan.mount.status, path: plan.mount.path, reason: plan.mount.reason },
  rewrite: plan.rewrite,
  assumedPresent: plan.assumedPresent,
  todos: plan.todos,
  nextCommands: plan.nextCommands,
});

/**
 * Build the error result shape used for missing kit source / unexpected failures.
 *
 * @param error - Human-readable error message.
 * @returns JSON error payload with exit code 1.
 */
const reportModeError = (error: string): CommandResult => ({
  json: JSON.stringify({ ok: false, error }),
  exitCode: 1,
});

/**
 * Install Report Mode into an existing project (or dry-run the plan). Infers the surface from
 * the destination; `spa`/`backend` return a clean "not available" answer without crashing.
 *
 * @param args - `[dir] [--to=dir] [--dry-run] [--force]`.
 * @returns JSON install report plus exit code.
 * @example
 * const result = await runAddReportMode(['--to=./my-app']);
 */
export const runAddReportMode = async (args: readonly string[]): Promise<CommandResult> => {
  const flags = parsePieceFlags(args);
  const destArg = flags.to === undefined || flags.to === '' ? flags.positionals.at(0) : flags.to;
  const dest = absoluteInstallDest(destArg, process.cwd());
  const surface = inferProjectSurfaceSync(dest).template;

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await locateKitWorkspace();
    const { cleanup: resolvedCleanup, kitRoot } = resolved;
    cleanup = resolvedCleanup;

    const appSurface = surface === 'web' ? await selectedAppSurface(dest) : undefined;
    const plan = await planReportModeInstall({
      kitRoot,
      dest,
      surface,
      assistant: detectedAssistantId(),
      ...(appSurface === undefined ? {} : { appSurface }),
    });

    if (!plan.available) {
      return {
        json: JSON.stringify(
          {
            ok: true,
            available: false,
            surface: plan.surface,
            reason: `Report Mode has no installable files for the ${plan.surface} surface (web, mobile, and extension only).`,
          },
          null,
          2,
        ),
        exitCode: 0,
      };
    }

    if (flags.dryRun) {
      return {
        json: JSON.stringify(installPayload(plan, [], [], true), null, 2),
        exitCode: 0,
      };
    }

    const { written, skipped } = await applyReportModeInstall(plan, { force: flags.force });
    return {
      json: JSON.stringify(installPayload(plan, written, skipped, false), null, 2),
      exitCode: 0,
    };
  } catch (error) {
    return reportModeError(caughtMessage(error));
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};
