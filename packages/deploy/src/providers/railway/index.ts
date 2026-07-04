import { fail, ok, type RailwayHostingConfig, type Result } from '@vybekiit/core';
import type { DeployOptions, DeployResult, DeployStatus, Hosting } from '@vybekiit/deploy/types';

/**
 * A deploy action the adapter hands to its runner: conceptually
 * `railway up --detach` from the linked project directory.
 */
export interface RailwayDeployAction {
  readonly command: 'railway';
  readonly args: readonly string[];
}

/** Outcome a runner reports back after executing a {@link RailwayDeployAction}. */
export interface RailwayRunResult {
  readonly url: string;
}

/**
 * Executes a {@link RailwayDeployAction} for real. Injected so the adapter stays
 * unit-testable without network access.
 */
export type RailwayRunner = (action: RailwayDeployAction) => Promise<RailwayRunResult>;

/**
 * Build the Railway {@link Hosting} adapter — opt-in via `HOSTING_PROVIDER=railway`
 * (ADR-0017). Auth is CLI-native (`railway login`); optional project/service ids
 * pin scope after `railway link`.
 */
export function createRailwayHosting(
  config: RailwayHostingConfig,
  runner?: RailwayRunner,
): Hosting {
  return {
    name: 'railway',

    async deploy(options: DeployOptions): Promise<Result<DeployResult>> {
      if (!runner) {
        return fail(
          'no_runner',
          'Railway hosting needs a deploy runner; the go-live skill supplies one with live creds.',
        );
      }
      const args: string[] = ['up', '--detach'];
      if (config.RAILWAY_SERVICE_ID) {
        args.push('--service', config.RAILWAY_SERVICE_ID);
      }
      args.push(options.buildDir);
      const action: RailwayDeployAction = { command: 'railway', args };
      try {
        const { url } = await runner(action);
        return ok({ url });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown deploy error';
        return fail('deploy_failed', `Railway deploy failed: ${detail}`);
      }
    },

    status(projectName: string): Promise<Result<DeployStatus>> {
      void projectName;
      void config;
      return Promise.resolve(ok({ live: false, url: null }));
    },
  };
}
