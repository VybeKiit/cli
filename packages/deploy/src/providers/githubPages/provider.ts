import type { EnvSource, GithubPagesHostingConfig } from '@vybekiit/core';
import { deployError, failDeploy } from '@vybekiit/deploy/deployEffect';
import { createGithubPagesHost } from '@vybekiit/deploy/liveWork/githubPagesProvision';
import type {
  DeployError,
  DeployOptions,
  DeployResult,
  DeployStatus,
  Hosting,
} from '@vybekiit/deploy/types';
import { Effect } from 'effect';

/** Normalized inputs the GitHub Pages runner needs beyond {@link DeployOptions}. */
export type GithubPagesDeployInput = {
  /** Project/site name the deploy publishes under (becomes the repo name). */
  readonly projectName: string;
  /** Path to the built static output directory to publish. */
  readonly buildDir: string;
  /** Repo owner override; falls back to the authenticated GitHub login. */
  readonly owner?: string;
  /** Environment carrying the GitHub token (`GITHUB_TOKEN`/`GH_TOKEN`); never logged. */
  readonly env: EnvSource;
};

/**
 * Executes a GitHub Pages deploy: publish a public repo and enable Pages, returning the
 * live URL. Injected so the adapter is unit-testable without network; the default delegates
 * to the shared Live-work provision boundary so buyer go-live and dogfood share one path.
 */
export type GithubPagesRunner = (
  input: GithubPagesDeployInput,
) => Effect.Effect<DeployResult, DeployError>;

/**
 * Default GitHub Pages runner — delegates to the shared Live-work deploy boundary
 * (`createGithubPagesHost`) so a buyer's go-live and internal dogfood publish through the exact
 * same provision path (SSOT, ADR-0040). Maps the Live-work failure and the missing-URL case
 * into the deploy error channel.
 *
 * @param input - Project name, build dir, optional owner, and token-carrying env.
 * @returns An Effect of the live deploy URL or a DeployError.
 * @example
 * const result = await Effect.runPromise(
 *   defaultGithubPagesRunner({ projectName: 'app', buildDir: 'dist', env: process.env }),
 * );
 */
export const defaultGithubPagesRunner: GithubPagesRunner = (input) =>
  createGithubPagesHost({
    mode: 'buyer',
    projectName: input.projectName,
    buildDir: input.buildDir,
    env: input.owner === undefined ? input.env : { ...input.env, GITHUB_PAGES_OWNER: input.owner },
  }).pipe(
    Effect.mapError((error) => deployError(error.code, error.message)),
    Effect.flatMap((host) =>
      host.url === undefined
        ? failDeploy<DeployResult>('deploy_failed', 'GitHub Pages deploy returned no URL.')
        : Effect.succeed({ url: host.url }),
    ),
  );

/**
 * Build the GitHub Pages {@link Hosting} adapter — opt-in via `HOSTING_PROVIDER=github-pages`
 * (ADR-0040). The free, zero-cold-start static host tied to the buyer's own repo. The GitHub
 * token comes from `gh` auth / `GITHUB_TOKEN` (ADR-0001), so credentials live in the captured
 * `env`, not a config key, and `deploy` stays credential-free at the call site. Real work is
 * delegated to the shared Live-work provision path.
 *
 * @param config - Parsed GitHub Pages hosting config (optional owner override).
 * @param env - Environment carrying the GitHub token; captured so deploy() stays credential-free.
 * @param runner - Executes the deploy; defaults to the shared Live-work boundary. Tests inject a fake.
 * @returns Hosting adapter backed by GitHub Pages.
 * @example
 * const hostingAdapter = createGithubPagesHosting(config, process.env);
 */
export const createGithubPagesHosting = (
  config: GithubPagesHostingConfig,
  env: EnvSource,
  runner: GithubPagesRunner = defaultGithubPagesRunner,
): Hosting => ({
  name: 'github-pages',

  deploy: (options: DeployOptions): Effect.Effect<DeployResult, DeployError> =>
    runner({
      projectName: options.projectName,
      buildDir: options.buildDir,
      env,
      ...(config.GITHUB_PAGES_OWNER === undefined ? {} : { owner: config.GITHUB_PAGES_OWNER }),
    }),

  status: (projectName: string): Effect.Effect<DeployStatus, DeployError> => {
    // A live status check needs the GitHub Pages API; the go-live skill performs it.
    void projectName;
    return Effect.succeed({ live: false, url: null });
  },
});
