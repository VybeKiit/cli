// `@aws-sdk/client-amplify` is the AWS SDK v3 client for AWS Amplify Hosting — AWS's
// managed host for web apps (static + SSR/Next.js) with git-driven, fully managed
// builds. We pick Amplify Hosting over raw EC2 (servers to patch), App Runner (no
// static/CDN story), or hand-rolled S3+CloudFront (lots of glue) because it is the
// least non-coder-hostile AWS web host: one app + branch, a deploy is a single job.
import { AmplifyClient, GetJobCommand, StartJobCommand } from '@aws-sdk/client-amplify';
import { type AwsConfig, type AwsHostingConfig, type Result, fail, ok } from '@vybekiit/core';
import type { DeployOptions, DeployResult, DeployStatus, Hosting } from '../../types';

/**
 * The only field this adapter reads off a job response: the latest deploy job's status
 * (`'SUCCEED'` means live). Typed as a loose, deeply-optional shape — not the SDK's full
 * `GetJobCommandOutput` — so the real {@link AmplifyClient} (whose richer output is a
 * superset) and a test's minimal canned object are both assignable, mirroring how the
 * Cloudflare adapter owns its small {@link CloudflareRunResult} contract.
 */
export interface AmplifyJobOutput {
  readonly job?: { readonly summary?: { readonly status?: string } };
}

/**
 * The slice of {@link AmplifyClient} this adapter calls. Injected (default a real
 * client) so the boundary is unit-testable without an AWS account or network: tests
 * pass a fake `send` that returns canned job output, mirroring how the Cloudflare
 * adapter injects its `CloudflareRunner`. Accepts the two commands we issue and returns
 * the narrow {@link AmplifyJobOutput} (only the status field is read), so a test double
 * stays small and the adapter never assumes the full SDK surface.
 */
export interface AmplifyRunner {
  send(command: StartJobCommand | GetJobCommand): Promise<AmplifyJobOutput>;
}

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
 */
export function createAwsHosting(
  config: AwsConfig,
  hosting: AwsHostingConfig,
  runner?: AmplifyRunner,
): Hosting {
  const client = runner ?? defaultClient(config);
  const liveUrl = (): string =>
    `https://${hosting.AWS_AMPLIFY_BRANCH}.${hosting.AWS_AMPLIFY_APP_ID}.amplifyapp.com`;

  return {
    name: 'aws',

    async deploy(options: DeployOptions): Promise<Result<DeployResult>> {
      void options;
      const appId = hosting.AWS_AMPLIFY_APP_ID;
      if (!appId) {
        return fail(
          'no_amplify_app',
          'Set AWS_AMPLIFY_APP_ID to the Amplify app the go-live skill provisioned.',
        );
      }
      try {
        await client.send(
          new StartJobCommand({
            appId,
            branchName: hosting.AWS_AMPLIFY_BRANCH,
            jobType: 'RELEASE',
          }),
        );
        return ok({ url: liveUrl() });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown deploy error';
        return fail('deploy_failed', `AWS Amplify deploy failed: ${detail}`);
      }
    },

    async status(projectName: string): Promise<Result<DeployStatus>> {
      void projectName;
      const appId = hosting.AWS_AMPLIFY_APP_ID;
      if (!appId) {
        return ok({ live: false, url: null });
      }
      try {
        const { job } = await client.send(
          new GetJobCommand({
            appId,
            branchName: hosting.AWS_AMPLIFY_BRANCH,
            // Amplify exposes the most recent job under the reserved id `latest`.
            jobId: 'latest',
          }),
        );
        const live = job?.summary?.status === 'SUCCEED';
        return ok({ live, url: live ? liveUrl() : null });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown status error';
        return fail('status_failed', `AWS Amplify status check failed: ${detail}`);
      }
    },
  };
}

/** Construct a real {@link AmplifyClient}, applying explicit creds only when both are set. */
function defaultClient(config: AwsConfig): AmplifyClient {
  const hasExplicitCredentials =
    config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;
  return new AmplifyClient({
    region: config.AWS_REGION,
    ...(hasExplicitCredentials
      ? {
          credentials: {
            // Narrowed to non-null by `hasExplicitCredentials`.
            accessKeyId: config.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
          },
        }
      : {}),
  });
}
