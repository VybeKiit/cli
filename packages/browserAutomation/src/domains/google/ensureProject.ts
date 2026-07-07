import { spawn } from 'node:child_process';
import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';

export type EnsureProjectResult = {
  projectId: string;
  /** True when `gcloud projects create` ran; false when the project already existed. */
  created: boolean;
};

/** Run a gcloud command, resolving its exit code (stdio silenced — creds never logged). */
const runGcloud = (args: readonly string[]): Promise<number> =>
  new Promise((resolve, reject) => {
    const child = spawn('gcloud', args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) => resolve(code === null ? 1 : code));
  });

/**
 * Ensure the GCP project exists before driving the browser. `gcloud projects describe` exits non-zero when the project is absent; we then create it. Projects ARE cli-creatable on a personal account — only the OAuth client isn't (hence the browser step).
 *
 * @param projectId - Provider project id to inspect.
 * @param log - Input value for log.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await ensureProject('project-id', log);
 */
export const ensureProject = async (
  projectId: string,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
): Promise<EnsureProjectResult> => {
  const describeCode = await runGcloud(['projects', 'describe', projectId, '--quiet']).catch(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `gcloud is required to ensure the project but could not run (${message}). ` +
          'Install the Google Cloud CLI and run `gcloud auth login`, then retry.',
      );
    },
  );

  if (describeCode === 0) {
    log.log(`[google] project ${projectId} exists — reusing`);
    return { projectId, created: false };
  }

  log.log(`[google] project ${projectId} not found — creating`);
  const createCode = await runGcloud(['projects', 'create', projectId, '--quiet']);
  if (createCode !== 0) {
    throw new Error(
      `Could not create GCP project "${projectId}" (gcloud exit ${createCode}). ` +
        'The ID may be taken or malformed (6–30 lowercase letters, digits, hyphens). Pick another and retry.',
    );
  }
  return { projectId, created: true };
};
