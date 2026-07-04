import { fail, ok, type Result, type VercelConfig } from '@vybekiit/core';
import type { DeployOptions, DeployResult, DeployStatus, Hosting } from '@vybekiit/deploy/types';

/**
 * A deploy action the adapter hands to its runner: conceptually
 * `vercel deploy --prod --yes` from the build directory with the project token.
 */
export interface VercelDeployAction {
  readonly command: 'vercel';
  readonly args: readonly string[];
}

/** Outcome a runner reports back after executing a {@link VercelDeployAction}. */
export interface VercelRunResult {
  readonly url: string;
}

/**
 * Executes a {@link VercelDeployAction} for real. Injected so the adapter stays
 * unit-testable without network access.
 */
export type VercelRunner = (action: VercelDeployAction) => Promise<VercelRunResult>;

/**
 * Build the Vercel {@link Hosting} adapter — opt-in via `HOSTING_PROVIDER=vercel`
 * (ADR-0006). Cloudflare remains the default; this is the Next.js-native host for
 * buyers who need Vercel's managed Next deploy story.
 */
export function createVercelHosting(config: VercelConfig, runner?: VercelRunner): Hosting {
  return {
    name: 'vercel',

    async deploy(options: DeployOptions): Promise<Result<DeployResult>> {
      if (!runner) {
        return fail(
          'no_runner',
          'Vercel hosting needs a deploy runner; the go-live skill supplies one with live creds.',
        );
      }
      const args: string[] = ['deploy', '--prod', '--yes', '--token', config.VERCEL_TOKEN];
      if (config.VERCEL_ORG_ID) {
        args.push('--scope', config.VERCEL_ORG_ID);
      }
      if (config.VERCEL_PROJECT_ID) {
        args.push('--project', config.VERCEL_PROJECT_ID);
      }
      args.push(options.buildDir);
      const action: VercelDeployAction = { command: 'vercel', args };
      try {
        const { url } = await runner(action);
        return ok({ url });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown deploy error';
        return fail('deploy_failed', `Vercel deploy failed: ${detail}`);
      }
    },

    status(projectName: string): Promise<Result<DeployStatus>> {
      void projectName;
      void config;
      return Promise.resolve(ok({ live: false, url: null }));
    },
  };
}
