import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { confirm, isCancel } from '@clack/prompts';
import { fingerprintFeedbackDraft } from '@vybekiit/agent-kit';
import { Effect, Option } from 'effect';
import open from 'open';
import {
  createFeedbackIntakeClient,
  FeedbackHttpError,
  type FeedbackIntakeClient,
  type IntakeSessionState,
} from '../feedback/feedbackClient';
import { readFeedbackConsent, saveFeedbackConsent } from '../feedback/feedbackConsent';
import { readFeedbackDraft, recordFeedbackSubmission } from '../feedback/feedbackFiles';
import { isInteractive } from '../prompts/tty';

export interface FeedbackCommandDependencies {
  readonly projectRoot: string;
  readonly feedbackDirectory: string;
  readonly interactive: boolean;
  readonly confirm: () => Promise<boolean>;
  readonly openBrowser: (url: string) => Promise<unknown>;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly writeOutput: (message: string) => void;
  readonly writeError: (message: string) => void;
  readonly now: () => Date;
  readonly client: FeedbackIntakeClient;
}

const defaultDependencies = (): FeedbackCommandDependencies => ({
  projectRoot: process.cwd(),
  feedbackDirectory: join(homedir(), '.vybekiit'),
  interactive: isInteractive(),
  confirm: async () => {
    const answer = await confirm({ message: 'Send this private feedback report to VybeKiit?' });
    return !isCancel(answer) && answer;
  },
  openBrowser: open,
  sleep: async (milliseconds) => await new Promise((resolve) => setTimeout(resolve, milliseconds)),
  writeOutput: (message) => process.stdout.write(`${message}\n`),
  writeError: (message) => process.stderr.write(`${message}\n`),
  now: () => new Date(),
  client: createFeedbackIntakeClient(),
});

const waitForSession = async (
  deviceCode: string,
  interval: number,
  expiresIn: number,
  dependencies: FeedbackCommandDependencies,
): Promise<Exclude<IntakeSessionState, { readonly status: 'pending' }>> => {
  const expiresAt = dependencies.now().getTime() + expiresIn * 1000;
  let pollingInterval = interval;
  while (dependencies.now().getTime() < expiresAt) {
    // biome-ignore lint/performance/noAwaitInLoops: GitHub device authorization requires sequential polling.
    const sessionState = await dependencies.client.pollDeviceLogin(deviceCode);
    if (sessionState.status !== 'pending') {
      return sessionState;
    }
    if (sessionState.retryAfter) {
      pollingInterval += sessionState.retryAfter;
    }
    await dependencies.sleep(pollingInterval * 1000);
  }
  return { status: 'denied', message: 'The sign-in code expired. Run /vybekiit-feedback again.' };
};

const showFeedbackUsage = (dependencies: FeedbackCommandDependencies): number => {
  dependencies.writeError(
    'Usage: vybekiit feedback status | consent on|off [--confirm] | submit <draft> [--confirm|--automatic]',
  );
  return 1;
};

export const runFeedback = async (
  args: readonly string[],
  suppliedDependencies?: FeedbackCommandDependencies,
): Promise<number> => {
  const dependencies = suppliedDependencies || defaultDependencies();
  const [action, draftPath] = args;

  try {
    const consent = await Effect.runPromise(readFeedbackConsent(dependencies.feedbackDirectory));
    const signedIn =
      Option.isSome(consent.session) && consent.expiresAt > dependencies.now().getTime();
    if (action === 'status') {
      dependencies.writeOutput(
        JSON.stringify({
          ok: true,
          automatic: consent.automatic,
          signedIn,
          drafts: '.vybekiit/feedback-drafts',
        }),
      );
      return 0;
    }
    if (action === 'consent' && draftPath === 'off') {
      await Effect.runPromise(
        saveFeedbackConsent(dependencies.feedbackDirectory, false, Option.none()),
      );
      dependencies.writeOutput('Automatic kit feedback is off.');
      return 0;
    }
    const enablingAutomatic = action === 'consent' && draftPath === 'on';
    if (!enablingAutomatic && (action !== 'submit' || !draftPath)) {
      return showFeedbackUsage(dependencies);
    }
    const automaticReport = args.includes('--automatic');
    if (automaticReport && !consent.automatic) {
      dependencies.writeError('Automatic feedback is off. Your draft is still saved.');
      return 1;
    }
    const authorized =
      automaticReport ||
      args.includes('--confirm') ||
      (dependencies.interactive && (await dependencies.confirm()));
    if (!authorized) {
      dependencies.writeOutput('Feedback was not sent. Your draft is still saved.');
      return dependencies.interactive ? 0 : 1;
    }
    if (automaticReport && !signedIn) {
      dependencies.writeError(
        'Feedback needs sign-in. Your draft is still saved. Run vybekiit feedback consent on --confirm when ready.',
      );
      return 1;
    }
    let feedbackSession = signedIn ? Option.getOrNull(consent.session) : null;
    if (feedbackSession === null) {
      const deviceLogin = await dependencies.client.createDeviceLogin();
      dependencies.writeOutput(
        `Sign in to send feedback: ${deviceLogin.verificationUri} code ${deviceLogin.userCode}`,
      );
      await dependencies.openBrowser(deviceLogin.verificationUri);
      const sessionState = await waitForSession(
        deviceLogin.deviceCode,
        deviceLogin.interval,
        deviceLogin.expiresIn,
        dependencies,
      );
      if (sessionState.status !== 'ready') {
        dependencies.writeError(sessionState.message);
        return 1;
      }

      await Effect.runPromise(
        saveFeedbackConsent(
          dependencies.feedbackDirectory,
          enablingAutomatic || consent.automatic,
          Option.some(sessionState.session),
          dependencies.now().getTime() + (sessionState.expiresIn ?? 900) * 1000,
        ),
      );
      feedbackSession = sessionState.session;
    } else if (enablingAutomatic) {
      await Effect.runPromise(
        saveFeedbackConsent(
          dependencies.feedbackDirectory,
          true,
          consent.session,
          consent.expiresAt,
        ),
      );
    }
    if (enablingAutomatic) {
      dependencies.writeOutput('Automatic sanitized kit feedback is on.');
      return 0;
    }
    if (!draftPath) return showFeedbackUsage(dependencies);
    const draft = await readFeedbackDraft(draftPath, dependencies.projectRoot);
    const receipt = await dependencies.client.submit({ session: feedbackSession, draft });
    await recordFeedbackSubmission(dependencies.projectRoot, {
      fingerprint: fingerprintFeedbackDraft(draft),
      reference: receipt.reference,
      submittedAt: dependencies.now().toISOString(),
    });
    dependencies.writeOutput(JSON.stringify({ ok: true, reference: receipt.reference }));
    return 0;
  } catch (error) {
    if (error instanceof FeedbackHttpError && error.status === 401) {
      const consent = await Effect.runPromise(readFeedbackConsent(dependencies.feedbackDirectory));
      await Effect.runPromise(
        saveFeedbackConsent(dependencies.feedbackDirectory, consent.automatic, Option.none()),
      );
      dependencies.writeError(
        'Feedback sign-in expired. Your draft is still saved. Run vybekiit feedback consent on --confirm when ready.',
      );
      return 1;
    }
    const detail =
      error instanceof Error && error.message.trim()
        ? error.message
        : 'The feedback service is unavailable. Try again later.';
    dependencies.writeError(`Feedback was not sent. Your draft is still saved. ${detail}`);
    return 1;
  }
};
