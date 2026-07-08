import type { RailwayHostingConfig } from '@vybekiit/core';
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
 * `railway up --detach` from the linked project directory.
 */
export type RailwayDeployAction = {
  readonly command: 'railway';
  readonly args: readonly string[];
};

/** Outcome a runner reports back after executing a {@link RailwayDeployAction}. */
export type RailwayRunResult = {
  readonly url: string;
};

/**
 * Executes a {@link RailwayDeployAction} for real. Injected so the adapter stays
 * unit-testable without network access.
 */
export type RailwayRunner = (action: RailwayDeployAction) => Promise<RailwayRunResult>;

/**
 * Build the Railway {@link Hosting} adapter — opt-in via `HOSTING_PROVIDER=railway`
 * (ADR-0017). Auth is CLI-native (`railway login`); optional project/service ids
 * pin scope after `railway link`.
 *
 * @param config - Railway hosting config.
 * @param runner - Executes Railway deploy actions.
 * @returns Hosting adapter backed by Railway.
 * @example
 * const hostingAdapter = createRailwayHosting(config, runner);
 */
export const createRailwayHosting = (
  config: RailwayHostingConfig,
  runner?: RailwayRunner,
): Hosting => ({
  name: 'railway',

  deploy: (options: DeployOptions): Effect.Effect<DeployResult, DeployError> =>
    Effect.gen(function* () {
      if (runner === undefined) {
        return yield* failDeploy(
          'no_runner',
          'Railway hosting needs a deploy runner; the go-live skill supplies one with live creds.',
        );
      }
      const args: string[] = ['up', '--detach'];
      if (config.RAILWAY_SERVICE_ID !== undefined) {
        args.push('--service', config.RAILWAY_SERVICE_ID);
      }
      args.push(options.buildDir);
      const action: RailwayDeployAction = { command: 'railway', args };
      const { url } = yield* Effect.tryPromise({
        try: () => runner(action),
        catch: (caught) =>
          deployError(
            'deploy_failed',
            `Railway deploy failed: ${caughtMessage(caught, 'unknown deploy error')}`,
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
