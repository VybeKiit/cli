import { resolve } from 'node:path';
import process from 'node:process';

import { confirm, isCancel } from '@clack/prompts';
import type { SafeKitUpdatePlan } from '@vybekiit/agent-kit';

import { inspectKitUpdate, type KitUpdateInspection } from '../lib/kitUpdateInspection';
import { testAndApplyKitUpdate } from '../lib/kitUpdateTransaction';
import { locateKitWorkspace } from '../lib/kitWorkspaceSource';
import { isInteractive } from '../prompts/tty';

export type SafeKitUpdateStatus =
  | 'planned'
  | 'applied'
  | 'cancelled'
  | 'owned-file-conflict'
  | 'verification-failed'
  | 'failed';

export type SafeKitUpdateOutcome = {
  readonly ok: boolean;
  readonly status: SafeKitUpdateStatus;
  readonly plan: SafeKitUpdatePlan;
  readonly recovery: string;
};

export type UpdateKitCommandReceipt = {
  readonly exitCode: number;
  readonly lines: readonly string[];
  readonly outcome: SafeKitUpdateOutcome;
};

export type UpdateKitCommandDependencies = {
  readonly interactive: boolean;
  readonly confirmApply: () => Promise<boolean>;
};

type UpdateKitCommandFacts = {
  readonly projectRoot: string;
  readonly kitSourceRoot: string;
  readonly apply: boolean;
  readonly json: boolean;
  readonly skipConfirmation: boolean;
};

const flagText = (commandArguments: readonly string[], flagName: string): string | undefined =>
  commandArguments
    .find((commandArgument) => commandArgument.startsWith(`${flagName}=`))
    ?.slice(flagName.length + 1);

const defaultDependencies = (): UpdateKitCommandDependencies => ({
  interactive: isInteractive(),
  confirmApply: async () => {
    const approved = await confirm({
      message: 'The update passed its safety plan. Test and apply it now?',
      initialValue: true,
    });
    return !isCancel(approved) && approved;
  },
});

const plainPlanLines = (plan: SafeKitUpdatePlan): readonly string[] => [
  `Update plan: ${plan.currentVersion} to ${plan.targetVersion}.`,
  plan.changedMaintainedAreas.length === 0
    ? 'Maintained areas: no changes.'
    : `Maintained areas: ${plan.changedMaintainedAreas.join(', ')}.`,
  plan.ownedFileConflicts.length === 0
    ? 'Your own files have no update conflicts.'
    : `Your own files have conflicts: ${plan.ownedFileConflicts.join(', ')}.`,
  'Nothing has changed yet.',
];

const commandReceipt = (
  outcome: SafeKitUpdateOutcome,
  json: boolean,
  plainLines: readonly string[],
): UpdateKitCommandReceipt => ({
  exitCode: outcome.ok ? 0 : 1,
  outcome,
  lines: json ? [JSON.stringify(outcome)] : plainLines,
});

const plannedReceipt = (inspection: KitUpdateInspection, json: boolean): UpdateKitCommandReceipt =>
  commandReceipt(
    {
      ok: true,
      status: 'planned',
      plan: inspection.plan,
      recovery: 'Run the same command with --apply when you are ready.',
    },
    json,
    plainPlanLines(inspection.plan),
  );

const conflictReceipt = (inspection: KitUpdateInspection, json: boolean): UpdateKitCommandReceipt =>
  commandReceipt(
    {
      ok: false,
      status: 'owned-file-conflict',
      plan: inspection.plan,
      recovery: 'Keep this version for now. Your own files were not changed.',
    },
    json,
    [...plainPlanLines(inspection.plan), 'The update stopped before changing your app.'],
  );

const cancelledReceipt = (
  inspection: KitUpdateInspection,
  json: boolean,
): UpdateKitCommandReceipt =>
  commandReceipt(
    {
      ok: true,
      status: 'cancelled',
      plan: inspection.plan,
      recovery: 'Run the update again whenever you are ready.',
    },
    json,
    [...plainPlanLines(inspection.plan), 'Update cancelled. Nothing was changed.'],
  );

const verifiedReceipt = (
  inspection: KitUpdateInspection,
  json: boolean,
  verification: 'applied' | 'verification-failed',
): UpdateKitCommandReceipt => {
  if (verification === 'verification-failed') {
    return commandReceipt(
      {
        ok: false,
        status: verification,
        plan: inspection.plan,
        recovery: 'Keep using the current version. Your working app was not changed.',
      },
      json,
      [
        ...plainPlanLines(inspection.plan),
        'The new version did not pass your app checks.',
        'Your working app was not changed.',
      ],
    );
  }
  return commandReceipt(
    {
      ok: true,
      status: verification,
      plan: inspection.plan,
      recovery: 'The previous version was kept until every check passed.',
    },
    json,
    [...plainPlanLines(inspection.plan), 'The latest safe improvements are working! 🎉'],
  );
};

const applyInspectedUpdate = async (
  inspection: KitUpdateInspection,
  commandFacts: UpdateKitCommandFacts,
  dependencies: UpdateKitCommandDependencies,
): Promise<UpdateKitCommandReceipt> => {
  if (!commandFacts.apply) {
    return plannedReceipt(inspection, commandFacts.json);
  }
  if (!inspection.plan.safeToApply) {
    return conflictReceipt(inspection, commandFacts.json);
  }
  const approved = commandFacts.skipConfirmation ? true : await dependencies.confirmApply();
  if (!approved) {
    return cancelledReceipt(inspection, commandFacts.json);
  }
  const verification = await testAndApplyKitUpdate(
    commandFacts.projectRoot,
    commandFacts.kitSourceRoot,
    inspection,
  );
  return verifiedReceipt(inspection, commandFacts.json, verification);
};

const failedReceipt = (updateFailure: unknown, json: boolean): UpdateKitCommandReceipt => {
  const detail = updateFailure instanceof Error ? updateFailure.message : 'Update unavailable.';
  const emptyPlan: SafeKitUpdatePlan = {
    currentVersion: 'unknown',
    targetVersion: 'unknown',
    changedMaintainedAreas: [],
    ownedFileConflicts: [],
    safeToApply: false,
    upToDate: false,
  };
  return commandReceipt(
    {
      ok: false,
      status: 'failed',
      plan: emptyPlan,
      recovery: 'Nothing was changed. Check that this is your app folder, then try again.',
    },
    json,
    [`The update could not be checked. ${detail}`, 'Nothing was changed.'],
  );
};

export const runUpdateKit = async (
  commandArguments: readonly string[] = [],
  suppliedDependencies?: Partial<UpdateKitCommandDependencies>,
): Promise<UpdateKitCommandReceipt> => {
  const standardDependencies = defaultDependencies();
  const dependencies: UpdateKitCommandDependencies = {
    interactive: suppliedDependencies?.interactive ?? standardDependencies.interactive,
    confirmApply: suppliedDependencies?.confirmApply ?? standardDependencies.confirmApply,
  };
  const projectRoot = resolve(flagText(commandArguments, '--cwd') ?? process.cwd());
  const explicitSource = flagText(commandArguments, '--source');
  const json = commandArguments.includes('--json');
  const locatedSource =
    explicitSource === undefined
      ? await locateKitWorkspace()
      : { kitRoot: resolve(explicitSource), cleanup: undefined };
  const commandFacts: UpdateKitCommandFacts = {
    projectRoot,
    kitSourceRoot: locatedSource.kitRoot,
    apply: commandArguments.includes('--apply'),
    json,
    skipConfirmation:
      commandArguments.includes('--yes') ||
      commandArguments.includes('-y') ||
      !dependencies.interactive,
  };

  return await inspectKitUpdate(projectRoot, locatedSource.kitRoot)
    .then(async (inspection) => await applyInspectedUpdate(inspection, commandFacts, dependencies))
    .catch((updateFailure: unknown) => failedReceipt(updateFailure, json))
    .finally(async () => await locatedSource.cleanup?.());
};

export const runUpdateKitCommand = async (commandArguments: readonly string[]): Promise<number> => {
  const receipt = await runUpdateKit(commandArguments);
  process.stdout.write(`${receipt.lines.join('\n')}\n`);
  return receipt.exitCode;
};
