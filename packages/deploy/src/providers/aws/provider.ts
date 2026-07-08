// `@aws-sdk/client-amplify` is the AWS SDK v3 client for AWS Amplify Hosting — AWS's
// managed host for web apps (static + SSR/Next.js) with git-driven, fully managed
// builds. We pick Amplify Hosting over raw EC2 (servers to patch), App Runner (no
// static/CDN story), or hand-rolled S3+CloudFront (lots of glue) because it is the
// least non-coder-hostile AWS web host: one app + branch, a deploy is a single job.
import { AmplifyClient, GetJobCommand, StartJobCommand } from '@aws-sdk/client-amplify';
import type { AwsConfig, AwsHostingConfig } from '@vybekiit/core';
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
 * The only field this adapter reads off a job response: the latest deploy job's status
 * (`'SUCCEED'` means live). Typed as a loose, deeply-optional shape — not the SDK's full
 * `GetJobCommandOutput` — so the real {@link AmplifyClient} (whose richer output is a
 * superset) and a test's minimal canned object are both assignable, mirroring how the
 * Cloudflare adapter owns its small {@link CloudflareRunResult} contract.
 */
export type AmplifyJobOutput = {
  readonly job?: { readonly summary?: { readonly status?: string } };
};

/**
 * The slice of {@link AmplifyClient} this adapter calls. Injected (default a real
 * client) so the boundary is unit-testable without an AWS account or network: tests
 * pass a fake `send` that returns canned job output, mirroring how the Cloudflare
 * adapter injects its `CloudflareRunner`. Accepts the two commands we issue and returns
 * the narrow {@link AmplifyJobOutput} (only the status field is read), so a test double
 * stays small and the adapter never assumes the full SDK surface.
 */
export type AmplifyRunner = {
  readonly send: (command: StartJobCommand | GetJobCommand) => Promise<AmplifyJobOutput>;
};

/**
 * Build the AWS Amplify live URL for the configured branch and app.
 *
 * @param hosting - AWS Amplify hosting config.
 * @returns Public Amplify app URL.
 * @example
 * const url = awsAmplifyLiveUrl(hosting);
 */
const awsAmplifyLiveUrl = (hosting: AwsHostingConfig): string =>
  `https://${hosting.AWS_AMPLIFY_BRANCH}.${hosting.AWS_AMPLIFY_APP_ID}.amplifyapp.com`;

/**
 * Start an AWS Amplify release job.
 *
 * @param client - Amplify client or test runner.
 * @param hosting - AWS Amplify hosting config.
 * @param options - Normalized deploy options.
 * @returns An Effect containing the deployed URL.
 * @example
 * const result = await Effect.runPromise(deployAwsAmplify(client, hosting, options));
 */
const deployAwsAmplify = (
  client: AmplifyRunner,
  hosting: AwsHostingConfig,
  options: DeployOptions,
): Effect.Effect<DeployResult, DeployError> =>
  Effect.gen(function* () {
    void options;
    const appId = hosting.AWS_AMPLIFY_APP_ID;
    if (appId === undefined || appId.length === 0) {
      return yield* failDeploy(
        'no_amplify_app',
        'Set AWS_AMPLIFY_APP_ID to the Amplify app the go-live skill provisioned.',
      );
    }
    yield* Effect.tryPromise({
      try: () =>
        client.send(
          new StartJobCommand({
            appId,
            branchName: hosting.AWS_AMPLIFY_BRANCH,
            jobType: 'RELEASE',
          }),
        ),
      catch: (caught) =>
        deployError(
          'deploy_failed',
          `AWS Amplify deploy failed: ${caughtMessage(caught, 'unknown deploy error')}`,
        ),
    });
    return { url: awsAmplifyLiveUrl(hosting) };
  });

/**
 * Read the latest AWS Amplify release status.
 *
 * @param client - Amplify client or test runner.
 * @param hosting - AWS Amplify hosting config.
 * @param projectName - Normalized project name from the hosting seam.
 * @returns An Effect containing current live status.
 * @example
 * const status = await Effect.runPromise(readAwsAmplifyStatus(client, hosting, 'app'));
 */
const readAwsAmplifyStatus = (
  client: AmplifyRunner,
  hosting: AwsHostingConfig,
  projectName: string,
): Effect.Effect<DeployStatus, DeployError> =>
  Effect.gen(function* () {
    void projectName;
    const appId = hosting.AWS_AMPLIFY_APP_ID;
    if (appId === undefined || appId.length === 0) {
      return { live: false, url: null };
    }
    const { job } = yield* Effect.tryPromise({
      try: () =>
        client.send(
          new GetJobCommand({
            appId,
            branchName: hosting.AWS_AMPLIFY_BRANCH,
            // Amplify exposes the most recent job under the reserved id `latest`.
            jobId: 'latest',
          }),
        ),
      catch: (caught) =>
        deployError(
          'status_failed',
          `AWS Amplify status check failed: ${caughtMessage(caught, 'unknown status error')}`,
        ),
    });
    const summary = job === undefined ? undefined : job.summary;
    const status = summary === undefined ? undefined : summary.status;
    if (status === 'SUCCEED') {
      return { live: true, url: awsAmplifyLiveUrl(hosting) };
    }
    return { live: false, url: null };
  });

/**
 * Build the AWS Amplify Hosting {@link Hosting} adapter — the opt-in host a buyer
 * selects with `HOSTING_PROVIDER=aws` (ADR-0002), the AWS counterpart to Cloudflare
 * Pages.
 *
 * Provisioning model: the Amplify app + branch are created ahead of time by the go-live
 * skill; this adapter only triggers a `RELEASE` job on that branch, so `deploy` needs
 * `AWS_AMPLIFY_APP_ID` set (it fails loud when blank rather than guessing). Region +
 * credentials come from {@link AwsConfig} exactly like the data/S3/SES adapters (explicit
 * keys only when both are present, else the SDK's default credential chain).
 *
 * The Amplify client is injectable (`runner`) so the package imports + tests run with no
 * AWS account; the go-live skill omits it to use a real {@link AmplifyClient}.
 *
 * @param config - AWS region + optional credentials
 * @param hosting - Amplify app id + branch the deploy targets
 * @param runner - Amplify client; defaults to a real one built from `config`
 * @returns Hosting adapter backed by AWS Amplify.
 * @example
 * const hostingAdapter = createAwsHosting(config, hosting);
 */
export const createAwsHosting = (
  config: AwsConfig,
  hosting: AwsHostingConfig,
  runner?: AmplifyRunner,
): Hosting => {
  const client = runner === undefined ? defaultClient(config) : runner;

  return {
    name: 'aws',

    deploy: (options: DeployOptions): Effect.Effect<DeployResult, DeployError> =>
      deployAwsAmplify(client, hosting, options),

    status: (projectName: string): Effect.Effect<DeployStatus, DeployError> =>
      readAwsAmplifyStatus(client, hosting, projectName),
  };
};

/**
 * Construct a real Amplify client, applying explicit creds only when both are set.
 *
 * @param config - AWS region and optional credentials.
 * @returns Amplify client for deploy/status calls.
 * @example
 * const client = defaultClient(config);
 */
const defaultClient = (config: AwsConfig): AmplifyClient => {
  const { AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = config;
  const credentials =
    accessKeyId !== undefined && secretAccessKey !== undefined
      ? { accessKeyId, secretAccessKey }
      : undefined;
  return new AmplifyClient({
    region: config.AWS_REGION,
    ...(credentials === undefined ? {} : { credentials }),
  });
};
