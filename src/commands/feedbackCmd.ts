import process from 'node:process';

import { confirm, isCancel } from '@clack/prompts';
import { fingerprintFeedbackDraft } from '@vybekiit/agent-kit';
import open from 'open';

import {
  createFeedbackIntakeClient,
  type FeedbackIntakeClient,
  type IntakeSessionState,
} from '../feedback/feedbackClient';
import { readFeedbackDraft, recordFeedbackSubmission } from '../feedback/feedbackFiles';
import { isInteractive } from '../prompts/tty';

export interface FeedbackCommandDependencies {
  readonly projectRoot: string;
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
  return { status: 'denied', message: 'The sign-in code expired. Run /feedback again.' };
};

const showFeedbackStatus = (dependencies: FeedbackCommandDependencies): number => {
  dependencies.writeOutput(
    JSON.stringify({ ok: true, drafts: '.vybekiit/feedback-drafts', confirmationRequired: true }),
  );
  return 0;
};

const showFeedbackUsage = (dependencies: FeedbackCommandDependencies): number => {
  dependencies.writeError('Usage: vybekiit feedback status | feedback submit <draft> [--confirm]');
  return 1;
};

export const runFeedback = async (
  args: readonly string[],
  suppliedDependencies?: FeedbackCommandDependencies,
): Promise<number> => {
  const dependencies = suppliedDependencies || defaultDependencies();
  const [action, draftPath] = args;

  if (action === 'status') {
    return showFeedbackStatus(dependencies);
  }

  if (action !== 'submit' || !draftPath) {
    return showFeedbackUsage(dependencies);
  }

  const confirmed = dependencies.interactive
    ? await dependencies.confirm()
    : args.includes('--confirm');
  if (!confirmed) {
    if (!dependencies.interactive) {
      dependencies.writeError(
        'Add --confirm only after the buyer has approved sending the report.',
      );
      return 1;
    }
    dependencies.writeOutput('Feedback was not sent. Your draft is still saved.');
    return 0;
  }

  try {
    const draft = await readFeedbackDraft(draftPath, dependencies.projectRoot);
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

    const receipt = await dependencies.client.submit({ session: sessionState.session, draft });
    await recordFeedbackSubmission(dependencies.projectRoot, {
      fingerprint: fingerprintFeedbackDraft(draft),
      reference: receipt.reference,
      submittedAt: dependencies.now().toISOString(),
    });
    dependencies.writeOutput(JSON.stringify({ ok: true, reference: receipt.reference }));
    return 0;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'The feedback service is unavailable.';
    dependencies.writeError(`Feedback was not sent. Your draft is still saved. ${detail}`);
    return 1;
  }
};
