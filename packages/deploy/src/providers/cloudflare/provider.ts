import type { CloudflareConfig } from '@vybekiit/core';
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
 * A deploy action the adapter hands to its runner: the exact command + args it
 * would invoke (conceptually `wrangler pages deploy <dir> --project-name <name>`).
 * Exposing the action — rather than shelling out inline — keeps the adapter a pure,
 * unit-testable boundary: tests inject a fake runner and assert the action shape,
 * and the real go-live skill supplies a runner that actually executes it.
 */
export type CloudflareDeployAction = {
  /** Executable to run (Cloudflare's CLI). */
  readonly command: 'wrangler';
  /** Full argument list, ready to pass to the runner. */
  readonly args: readonly string[];
};

/** Outcome a runner reports back after executing a {@link CloudflareDeployAction}. */
export type CloudflareRunResult = {
  /** Public URL the deploy produced. */
  readonly url: string;
};

/**
 * Executes a {@link CloudflareDeployAction} for real. Injected so the adapter never
 * couples to a child-process or network call directly — the default in production is
 * supplied by the go-live skill (which has live Cloudflare creds + a shell); tests
 * pass a fake that returns a canned URL without touching the network.
 */
export type CloudflareRunner = (action: CloudflareDeployAction) => Promise<CloudflareRunResult>;

/**
 * Build the Cloudflare {@link Hosting} adapter — VybeKiit's v1 default host (Pages
 * for static/SSR sites, no AWS console). Because a real deploy needs live creds and
 * a shell, the adapter is headless and injectable: it constructs the intended
 * `wrangler` action and delegates execution to `runner`. A buyer's go-live skill
 * wires a real runner; the absence of one keeps the package importable + testable
 * with no Cloudflare account present.
 *
 * @param config - Cloudflare account credentials (account id + API token)
 * @param runner - executes the deploy action; omit to defer wiring to the caller
 * @returns Hosting adapter backed by Cloudflare Pages.
 * @example
 * const hostingAdapter = createCloudflareHosting(config, runner);
 */
export const createCloudflareHosting = (
  config: CloudflareConfig,
  runner?: CloudflareRunner,
): Hosting => {
  return {
    name: 'cloudflare',

    deploy: (options: DeployOptions): Effect.Effect<DeployResult, DeployError> =>
      Effect.gen(function* () {
        if (runner === undefined) {
          return yield* failDeploy(
            'no_runner',
            'Cloudflare hosting needs a deploy runner; the go-live skill supplies one with live creds.',
          );
        }
        const action: CloudflareDeployAction = {
          command: 'wrangler',
          args: [
            'pages',
            'deploy',
            options.buildDir,
            '--project-name',
            options.projectName,
            '--account-id',
            config.CLOUDFLARE_ACCOUNT_ID,
          ],
        };
        const { url } = yield* Effect.tryPromise({
          try: () => runner(action),
          catch: (caught) =>
            deployError(
              'deploy_failed',
              `Cloudflare deploy failed: ${caughtMessage(caught, 'unknown deploy error')}`,
            ),
        });
        return { url };
      }),

    status: (projectName: string): Effect.Effect<DeployStatus, DeployError> => {
      const status: DeployStatus = {
        live: false,
        url: null,
      };
      // A live status check needs the Cloudflare API; the go-live skill performs it
      // with the account token. Without a runner we report "not yet wired".
      void projectName;
      return Effect.succeed(status);
    },
  };
};
