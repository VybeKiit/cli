import { chmod, lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';

import { decodeFeedbackDraft, type FeedbackDraft } from '@vybekiit/agent-kit';

export class FeedbackFileError extends Error {
  readonly code: 'invalid_draft_path' | 'invalid_draft' | 'draft_too_large';

  constructor(code: FeedbackFileError['code'], message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'FeedbackFileError';
    this.code = code;
  }
}

export interface FeedbackSubmissionRecord {
  readonly fingerprint: string;
  readonly reference: string;
  readonly submittedAt: string;
}

const isBeneath = (candidatePath: string, parentPath: string): boolean => {
  const pathFromParent = relative(parentPath, candidatePath);
  return pathFromParent !== '' && !pathFromParent.startsWith('..') && !isAbsolute(pathFromParent);
};

export const readFeedbackDraft = async (
  draftPath: string,
  projectRoot: string,
): Promise<FeedbackDraft> => {
  const draftsDirectory = await realpath(join(projectRoot, '.vybekiit', 'feedback-drafts'));
  const draftEntry = await lstat(draftPath).catch(() => undefined);
  if (!draftEntry?.isFile() || draftEntry.isSymbolicLink()) {
    throw new FeedbackFileError(
      'invalid_draft_path',
      'Choose a feedback draft created in this app.',
    );
  }

  const resolvedDraftPath = await realpath(draftPath);
  if (!isBeneath(resolvedDraftPath, draftsDirectory)) {
    throw new FeedbackFileError(
      'invalid_draft_path',
      'Choose a feedback draft created in this app.',
    );
  }
  if (draftEntry.size > 32 * 1024) {
    throw new FeedbackFileError(
      'draft_too_large',
      'This feedback draft is too large to send safely.',
    );
  }

  try {
    return decodeFeedbackDraft(JSON.parse(await readFile(resolvedDraftPath, 'utf8')));
  } catch (error) {
    if (error instanceof FeedbackFileError) {
      throw error;
    }
    // biome-ignore lint/style/useErrorCause: FeedbackFileError forwards its third argument to Error.cause.
    throw new FeedbackFileError(
      'invalid_draft',
      'This feedback draft could not be read safely.',
      error,
    );
  }
};

export const recordFeedbackSubmission = async (
  projectRoot: string,
  submission: FeedbackSubmissionRecord,
): Promise<void> => {
  const feedbackDirectory = join(projectRoot, '.vybekiit');
  const submissionsPath = join(feedbackDirectory, 'feedback-submissions.json');
  const temporaryPath = `${submissionsPath}.${process.pid}.tmp`;
  await mkdir(feedbackDirectory, { recursive: true, mode: 0o700 });

  let submissions: FeedbackSubmissionRecord[] = [];
  try {
    const storedSubmissions: unknown = JSON.parse(await readFile(submissionsPath, 'utf8'));
    if (Array.isArray(storedSubmissions)) {
      submissions = storedSubmissions.filter(
        (entry): entry is FeedbackSubmissionRecord =>
          typeof entry === 'object' &&
          entry !== null &&
          'fingerprint' in entry &&
          typeof entry.fingerprint === 'string' &&
          'reference' in entry &&
          typeof entry.reference === 'string' &&
          'submittedAt' in entry &&
          typeof entry.submittedAt === 'string',
      );
    }
  } catch {
    submissions = [];
  }

  await writeFile(temporaryPath, `${JSON.stringify([...submissions, submission], null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporaryPath, submissionsPath);
  await chmod(submissionsPath, 0o600);
};
