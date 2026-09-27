import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

import {
  checkGuardianTargets,
  type GuardianCheckControls,
  type GuardianReport,
  type GuardianTarget,
} from '@vybekiit/deploy/guardian';
import { Data, Effect, Either, Schema } from 'effect';

import { hasBoolFlag, readFlagValue } from '../lib/argvFlags';

const GuardianFingerprints = Schema.Array(Schema.String);

class GuardianCommandFailure extends Data.TaggedError('GuardianCommandFailure')<{
  readonly message: string;
}> {}

export type GuardianCommandControls = Pick<GuardianCheckControls, 'fetch' | 'now' | 'checkedAt'> & {
  readonly projectDirectory?: string;
  readonly appUrl?: string;
};

export type GuardianCommandOutcome = {
  readonly printedText: string;
  readonly exitCode: number;
};

const guardianTargetFromText = (targetText: string): GuardianTarget | null => {
  const separatorIndex = targetText.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const name = targetText.slice(0, separatorIndex).trim();
  const url = targetText.slice(separatorIndex + 1).trim();
  if (name === '' || url === '') {
    return null;
  }

  return { name, url };
};

const guardianTargetTextAt = (
  commandArguments: readonly string[],
  commandArgument: string,
  argumentIndex: number,
): string | undefined => {
  const inlinePrefix = '--target=';
  if (commandArgument.startsWith(inlinePrefix)) {
    return commandArgument.slice(inlinePrefix.length);
  }

  if (commandArguments[argumentIndex - 1] === '--target') {
    return commandArgument;
  }

  return undefined;
};

export const parseGuardianTargets = (commandArguments: readonly string[]): GuardianTarget[] =>
  commandArguments.flatMap((commandArgument, argumentIndex) => {
    const targetText = guardianTargetTextAt(commandArguments, commandArgument, argumentIndex);
    const guardianTarget = targetText === undefined ? null : guardianTargetFromText(targetText);

    return guardianTarget === null ? [] : [guardianTarget];
  });

const incidentFilePath = (projectDirectory: string): string =>
  join(projectDirectory, '.vybekiit', 'guardian-incidents.json');

const failureMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'The guardian could not save its incident history.';

const readIncidentFingerprints = (
  projectDirectory: string,
): Effect.Effect<readonly string[], GuardianCommandFailure> =>
  Effect.tryPromise({
    try: async () => {
      try {
        const incidentJson = await readFile(incidentFilePath(projectDirectory), 'utf8');
        return Schema.decodeUnknownSync(GuardianFingerprints)(JSON.parse(incidentJson));
      } catch (cause) {
        const missingFile = cause instanceof Error && Reflect.get(cause, 'code') === 'ENOENT';
        if (missingFile) {
          return [];
        }
        throw cause;
      }
    },
    catch: (cause) => new GuardianCommandFailure({ message: failureMessage(cause) }),
  });

const writeIncidentFingerprints = (
  projectDirectory: string,
  fingerprints: readonly string[],
): Effect.Effect<void, GuardianCommandFailure> =>
  Effect.tryPromise({
    try: async () => {
      await mkdir(join(projectDirectory, '.vybekiit'), { recursive: true });
      await writeFile(
        incidentFilePath(projectDirectory),
        `${JSON.stringify(fingerprints, null, 2)}\n`,
        'utf8',
      );
    },
    catch: (cause) => new GuardianCommandFailure({ message: failureMessage(cause) }),
  });

const privacySafeUrl = (targetUrl: string): string => {
  const parsedUrl = new URL(targetUrl);
  return `${parsedUrl.origin}${parsedUrl.pathname}`;
};

const publicGuardianReport = (guardianReport: GuardianReport): GuardianReport => ({
  ...guardianReport,
  observations: guardianReport.observations.map((observation) => ({
    ...observation,
    url: privacySafeUrl(observation.url),
  })),
});

const textGuardianReport = (guardianReport: GuardianReport): string => {
  if (guardianReport.healthy) {
    return 'Your app is responding normally. 🎉';
  }

  return guardianReport.incidents
    .map((incident) => {
      const incidentKind = incident.duplicate ? 'Already reported' : 'New issue';
      return `${incidentKind}: ${incident.summary}\nRepair note: ${incident.repairBrief}`;
    })
    .join('\n\n');
};

export const runGuardianCheck = async (
  commandArguments: readonly string[],
  controls: GuardianCommandControls = {},
): Promise<GuardianCommandOutcome> => {
  const appUrl = controls.appUrl ?? process.env.APP_URL;
  const argumentTargets = parseGuardianTargets(commandArguments);
  const appTargets = appUrl === undefined || appUrl === '' ? [] : [{ name: 'app', url: appUrl }];
  const targets = argumentTargets.length > 0 ? argumentTargets : appTargets;

  if (targets.length === 0) {
    return {
      printedText:
        'Tell the guardian what to check with --target=name=https://your-app.com/health or set APP_URL.',
      exitCode: 1,
    };
  }

  const cwdFlag = readFlagValue(commandArguments, 'cwd');
  const projectDirectory =
    controls.projectDirectory ?? resolve(process.cwd(), cwdFlag === undefined ? '.' : cwdFlag);
  const guardianEffect = Effect.gen(function* () {
    const knownFingerprints = yield* readIncidentFingerprints(projectDirectory);
    const guardianReport = yield* checkGuardianTargets(targets, {
      knownFingerprints,
      ...(controls.fetch === undefined ? {} : { fetch: controls.fetch }),
      ...(controls.now === undefined ? {} : { now: controls.now }),
      ...(controls.checkedAt === undefined ? {} : { checkedAt: controls.checkedAt }),
    }).pipe(
      Effect.mapError(
        (guardianError) => new GuardianCommandFailure({ message: guardianError.message }),
      ),
    );
    const allFingerprints = [...new Set([...knownFingerprints, ...guardianReport.newFingerprints])];
    yield* writeIncidentFingerprints(projectDirectory, allFingerprints);
    return guardianReport;
  });
  const guardianEither = await Effect.runPromise(Effect.either(guardianEffect));

  if (Either.isLeft(guardianEither)) {
    return { printedText: guardianEither.left.message, exitCode: 1 };
  }

  const guardianReport = publicGuardianReport(guardianEither.right);
  return {
    printedText: hasBoolFlag(commandArguments, 'json')
      ? JSON.stringify(guardianReport, null, 2)
      : textGuardianReport(guardianReport),
    exitCode: guardianReport.healthy ? 0 : 2,
  };
};
