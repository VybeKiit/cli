import type { VercelConfig } from '@vybekiit/core';
import { caughtMessage, deployError, failDeploy } from '@vybekiit/deploy/deployEffect';
import type {
  DeployError,
  DeployOptions,
  DeployResult,
  DeployStatus,
  Hosting,
} from '@vybekiit/deploy/types';
import { Effect } from 'effect';

/**
 * A deploy action the adapter hands to its runner: conceptually
 * `vercel deploy --prod --yes` from the build directory with the project token.
 */
export type VercelDeployAction = {
  readonly command: 'vercel';
  readonly args: readonly string[];
};

/** Outcome a runner reports back after executing a {@link VercelDeployAction}. */
export type VercelRunResult = {
  readonly url: string;
};

/**
 * Executes a {@link VercelDeployAction} for real. Injected so the adapter stays
 * unit-testable without network access.
 */
export type VercelRunner = (action: VercelDeployAction) => Promise<VercelRunResult>;

/**
 * Build the Vercel {@link Hosting} adapter — opt-in via `HOSTING_PROVIDER=vercel`
 * (ADR-0006). Cloudflare remains the default; this is the Next.js-native host for
 * buyers who need Vercel's managed Next deploy story.
 *
 * @param config - Vercel API config.
 * @param runner - Executes Vercel deploy actions.
 * @returns Hosting adapter backed by Vercel.
 * @example
 * const hostingAdapter = createVercelHosting(config, runner);
 */
export const createVercelHosting = (config: VercelConfig, runner?: VercelRunner): Hosting => ({
  name: 'vercel',

  deploy: (options: DeployOptions): Effect.Effect<DeployResult, DeployError> =>
    Effect.gen(function* () {
      if (runner === undefined) {
        return yield* failDeploy(
          'no_runner',
          'Vercel hosting needs a deploy runner; the go-live skill supplies one with live creds.',
        );
      }
      const args: string[] = ['deploy', '--prod', '--yes', '--token', config.VERCEL_TOKEN];
      if (config.VERCEL_ORG_ID !== undefined) {
        args.push('--scope', config.VERCEL_ORG_ID);
      }
      if (config.VERCEL_PROJECT_ID !== undefined) {
        args.push('--project', config.VERCEL_PROJECT_ID);
      }
      args.push(options.buildDir);
      const action: VercelDeployAction = { command: 'vercel', args };
      const { url } = yield* Effect.tryPromise({
        try: () => runner(action),
        catch: (caught) =>
          deployError(
            'deploy_failed',
            `Vercel deploy failed: ${caughtMessage(caught, 'unknown deploy error')}`,
          ),
      });
      return { url };
    }),

  status: (projectName: string): Effect.Effect<DeployStatus, DeployError> => {
    void projectName;
    void config;
    return Effect.succeed({ live: false, url: null });
  },
});
