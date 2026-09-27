import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';
import { FeedbackHttpError } from '../feedback/feedbackClient';
import { type FeedbackCommandDependencies, runFeedback } from './feedbackCmd';

const createDraft = async (): Promise<{ readonly root: string; readonly path: string }> => {
  const root = await mkdtemp(join(tmpdir(), 'vybekiit-feedback-command-'));
  const draftsDirectory = join(root, '.vybekiit', 'feedback-drafts');
  const path = join(draftsDirectory, 'draft.json');
  await mkdir(draftsDirectory, { recursive: true });
  await writeFile(
    path,
    JSON.stringify({
      kind: 'idea',
      buyerMessage: 'Add a clearer first-run guide.',
      agentSummary: 'The buyer asked for a guided first run.',
      reproductionSteps: ['Open the app'],
      template: 'web',
      trigger: 'explicit',
      diagnostics: {
        agent: 'claude-code',
        agentVersion: '2.1.207',
        kitVersion: '0.7.1',
        operatingSystem: 'macOS',
      },
    }),
  );
  return { root, path };
};

const createDependencies = (
  root: string,
  confirm: () => Promise<boolean>,
): FeedbackCommandDependencies => ({
  projectRoot: root,
  feedbackDirectory: join(root, '.vybekiit'),
  interactive: true,
  confirm,
  openBrowser: vi.fn(async () => undefined),
  sleep: vi.fn(async () => undefined),
  writeOutput: vi.fn(),
  writeError: vi.fn(),
  now: () => new Date('2026-07-22T12:00:00.000Z'),
  client: {
    createDeviceLogin: vi.fn(async () => ({
      deviceCode: 'device-code',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 1,
    })),
    pollDeviceLogin: vi.fn(async () => ({ status: 'ready' as const, session: 'intake-session' })),
    submit: vi.fn(async () => ({ reference: 'FB-01JTEST' })),
  },
});

describe('feedback command', () => {
  it('explains an unavailable service even when the HTTP error has no message', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => true);
    vi.mocked(dependencies.client.createDeviceLogin).mockRejectedValue(
      new FeedbackHttpError({ status: 502 }),
    );

    expect(await runFeedback(['submit', draft.path, '--confirm'], dependencies)).toBe(1);
    expect(dependencies.writeError).toHaveBeenCalledWith(
      'Feedback was not sent. Your draft is still saved. The feedback service is unavailable. Try again later.',
    );
    await expect(stat(draft.path)).resolves.toBeDefined();
  });

  it('clears a rejected cached sign-in without opening a browser automatically', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => true);
    await runFeedback(['consent', 'on', '--confirm'], dependencies);
    vi.mocked(dependencies.client.submit).mockRejectedValue(new FeedbackHttpError({ status: 401 }));
    expect(await runFeedback(['submit', draft.path, '--automatic'], dependencies)).toBe(1);
    expect(dependencies.openBrowser).toHaveBeenCalledOnce();
    await runFeedback(['status'], dependencies);
    expect(dependencies.writeOutput).toHaveBeenLastCalledWith(
      expect.stringContaining('"signedIn":false'),
    );
    await expect(stat(draft.path)).resolves.toBeDefined();
  });

  it('retains consent after expiry and requires explicit sign-in renewal', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => true);
    await runFeedback(['consent', 'on', '--confirm'], dependencies);
    const later = { ...dependencies, now: () => new Date('2026-09-01T12:00:00Z') };
    expect(await runFeedback(['submit', draft.path, '--automatic'], later)).toBe(1);
    expect(dependencies.client.submit).not.toHaveBeenCalled();
    expect(dependencies.openBrowser).toHaveBeenCalledOnce();
    expect(await runFeedback(['consent', 'on', '--confirm'], later)).toBe(0);
    expect(dependencies.openBrowser).toHaveBeenCalledTimes(2);
  });
  it('does not send automatic reports without a saved opt-in', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => true);
    expect(await runFeedback(['submit', draft.path, '--automatic'], dependencies)).toBe(1);
    expect(dependencies.client.createDeviceLogin).not.toHaveBeenCalled();
    expect(dependencies.client.submit).not.toHaveBeenCalled();
  });

  it('remembers consent, sends automatically, and stops after revocation', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(
      draft.root,
      vi.fn(async () => true),
    );
    expect(await runFeedback(['consent', 'on', '--confirm'], dependencies)).toBe(0);
    expect(await runFeedback(['submit', draft.path, '--automatic'], dependencies)).toBe(0);
    expect(dependencies.client.submit).toHaveBeenCalledOnce();
    expect(dependencies.confirm).not.toHaveBeenCalled();
    expect(await runFeedback(['consent', 'off'], dependencies)).toBe(0);
    expect(await runFeedback(['submit', draft.path, '--automatic'], dependencies)).toBe(1);
    expect(dependencies.client.submit).toHaveBeenCalledOnce();
  });

  it('does not call submit when confirmation is declined', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => false);

    expect(await runFeedback(['submit', draft.path], dependencies)).toBe(0);
    expect(dependencies.client.submit).not.toHaveBeenCalled();
  });

  it('keeps the draft when intake is unavailable', async () => {
    const draft = await createDraft();
    const dependencies = createDependencies(draft.root, async () => true);
    vi.mocked(dependencies.client.createDeviceLogin).mockRejectedValue(new Error('offline'));

    expect(await runFeedback(['submit', draft.path], dependencies)).toBe(1);
    await expect(stat(draft.path)).resolves.toBeDefined();
  });

  it('requires --confirm when the terminal is not interactive', async () => {
    const draft = await createDraft();
    const dependencies = {
      ...createDependencies(draft.root, async () => true),
      interactive: false,
    };

    expect(await runFeedback(['submit', draft.path], dependencies)).toBe(1);
    expect(dependencies.client.submit).not.toHaveBeenCalled();
  });
});
