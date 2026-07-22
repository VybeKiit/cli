import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readFeedbackDraft, recordFeedbackSubmission } from './feedbackFiles';

const draft = {
  kind: 'bug',
  buyerMessage: 'Checkout is stuck.',
  agentSummary: 'The checkout request did not complete.',
  reproductionSteps: ['Choose a plan'],
  template: 'web',
  trigger: 'explicit',
  diagnostics: {
    agent: 'claude-code',
    agentVersion: '2.1.207',
    kitVersion: '0.7.1',
    operatingSystem: 'macOS',
  },
} as const;

describe('feedback files', () => {
  it('reads only a regular draft beneath .vybekiit/feedback-drafts', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'vybekiit-feedback-'));
    const draftsDirectory = join(projectRoot, '.vybekiit', 'feedback-drafts');
    const draftPath = join(draftsDirectory, 'draft.json');
    const outsidePath = join(projectRoot, 'outside.json');
    await mkdir(draftsDirectory, { recursive: true });
    await writeFile(draftPath, JSON.stringify(draft));
    await writeFile(outsidePath, JSON.stringify(draft));

    await expect(readFeedbackDraft(outsidePath, projectRoot)).rejects.toMatchObject({
      code: 'invalid_draft_path',
    });
    await expect(readFeedbackDraft(draftPath, projectRoot)).resolves.toEqual(draft);

    const linkPath = join(draftsDirectory, 'linked.json');
    await symlink(outsidePath, linkPath);
    await expect(readFeedbackDraft(linkPath, projectRoot)).rejects.toMatchObject({
      code: 'invalid_draft_path',
    });
  });

  it('stores only fingerprint, reference, and submitted time', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'vybekiit-feedback-'));
    const submission = {
      fingerprint: 'abc123',
      reference: 'FB-01JTEST',
      submittedAt: '2026-07-22T12:00:00.000Z',
    };

    await recordFeedbackSubmission(projectRoot, submission);

    const submissionsPath = join(projectRoot, '.vybekiit', 'feedback-submissions.json');
    expect(JSON.parse(await readFile(submissionsPath, 'utf8'))).toEqual([submission]);
  });
});
