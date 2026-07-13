import { Data, type Effect } from 'effect';

/**
 * The hosting backends VybeKiit ships an adapter for. One runs at a time (chosen
 * via `HOSTING_PROVIDER`); the agent swaps by changing that one env value, because
 * the go-live skill talks to the {@link Hosting} interface rather than a specific
 * vendor. Cloudflare is the v1 default; `vercel`, `aws` (Amplify/SST), `railway`, and
 * `github-pages` (free static, ADR-0040) are opt-in (ADR-0002/0006/0017/0040).
 */
export type HostingProviderName = 'cloudflare' | 'vercel' | 'aws' | 'railway' | 'github-pages';

/**
 * Inputs for a deploy, normalized across hosts. Kept minimal: the go-live skill
 * already knows the built project; the adapter only needs where the build lives and
 * what to call the deployed project.
 */
export type DeployOptions = {
  /** Project/site name the host deploys under (e.g. a Pages/Workers project). */
  readonly projectName: string;
  /** Path to the built output directory the host should publish. */
  readonly buildDir: string;
};

/** A completed deploy the go-live skill reports back to the builder. */
export type DeployResult = {
  /** Public URL the deployed project is now reachable at. */
  readonly url: string;
};

/** Whether a previously deployed project is currently live. */
export type DeployStatus = {
  /** True when the host reports the project deployed and reachable. */
  readonly live: boolean;
  /** Public URL when live, else `null`. */
  readonly url: string | null;
};

/** Expected deploy failures callers can recover from and translate. */
export class DeployError extends Data.TaggedError('DeployError')<{
  readonly code: string;
  readonly message: string;
}> {}

/**
 * The swappable hosting seam, driven by the agent's go-live skill. Each adapter is
 * constructed from its own validated config (credentials live in the factory), so
 * both methods are credential-free at the call site and uniform across hosts. Every
 * method returns an Effect so an expected boundary failure (bad token, build not found,
 * host outage) is branched on by `DeployError`, not thrown.
 */
export type Hosting = {
  /** Which host this instance deploys to. */
  readonly name: HostingProviderName;
  /** Publish a built project and return its live URL. */
  readonly deploy: (options: DeployOptions) => Effect.Effect<DeployResult, DeployError>;
  /** Report whether a previously deployed project is currently live. */
  readonly status: (projectName: string) => Effect.Effect<DeployStatus, DeployError>;
};
