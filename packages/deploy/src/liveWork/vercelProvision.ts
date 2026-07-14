import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect } from 'effect';
import {
  defaultLiveWorkProjectName,
  verifyHostUrl,
  writeDemoStaticSite,
} from './cloudflareProvision';
import {
  HostLiveWorkError,
  type LiveWorkMode,
  makeProvisionedHost,
  type ProvisionedHost,
} from './types';

/**
 * Result of a single Vercel CLI invocation (injectable for tests).
 */
export type VercelCliResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/**
 * Runnable Vercel CLI seam — default shells out to `vercel`.
 */
export type VercelCliRunner = (
  args: readonly string[],
  options?: { readonly cwd?: string },
) => Promise<VercelCliResult>;

/**
 * Options for {@link createVercelHost}.
 */
export type CreateVercelHostOptions = {
  readonly mode: LiveWorkMode;
  readonly projectName?: string;
  readonly buildDir?: string;
  readonly cwd?: string;
  /** Optional VERCEL_TOKEN (from env in live runs). */
  readonly token?: string;
  readonly runCli?: VercelCliRunner;
  readonly fetchImpl?: typeof fetch;
  readonly skipVerify?: boolean;
};

/**
 * Default runner: spawn `vercel` with the given args.
 *
 * @param args - CLI args after `vercel`.
 * @param options - Optional working directory.
 * @returns Exit code and streams.
 */
export const defaultVercelCliRunner: VercelCliRunner = async (args, options = {}) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  try {
    const { stdout, stderr } = await execFileAsync('vercel', [...args], {
      cwd: options.cwd,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    });
    return {
      code: 0,
      stdout: typeof stdout === 'string' ? stdout : String(stdout),
      stderr: typeof stderr === 'string' ? stderr : String(stderr),
    };
  } catch (cause) {
    const err = cause as {
      code?: number | string;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    let stderr = 'vercel failed';
    if (typeof err.stderr === 'string') {
      stderr = err.stderr;
    } else if (typeof err.message === 'string') {
      stderr = err.message;
    }
    return {
      code: typeof err.code === 'number' ? err.code : 1,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr,
    };
  }
};

/**
 * Extract the first Vercel deployment URL from CLI output.
 *
 * @param text - Combined CLI output.
 * @returns https URL or null.
 * @example
 * parseVercelDeployUrl('… https://demo.vercel.app …') === 'https://demo.vercel.app'
 */
export const parseVercelDeployUrl = (text: string): string | null => {
  // "https://foo.vercel.app" or "https://foo-xxx.vercel.app"
  const match = text.match(/https:\/\/[a-z0-9][a-z0-9.-]*\.vercel\.app(?:\/[^\s"'`]*)?/i);
  if (match === null || match[0] === undefined) {
    return null;
  }
  try {
    return new URL(match[0]).origin;
  } catch {
    return match[0].replace(/\/$/, '');
  }
};

/**
 * Best-effort delete a Vercel project (demo/dogfood teardown).
 *
 * @param projectName - Project name.
 * @param runCli - Optional CLI runner.
 * @param token - Optional token flag.
 * @returns Always-succeeding Effect.
 */
export const deleteVercelProject = (
  projectName: string,
  runCli: VercelCliRunner = defaultVercelCliRunner,
  token?: string,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      const args = ['project', 'rm', projectName, '--yes'];
      if (token !== undefined && token.length > 0) {
        args.push('--token', token);
      }
      await runCli(args);
    } catch {
      // best-effort teardown
    }
  });

/**
 * Provision a Vercel project via CLI (ADR-0039 host ladder #4).
 * Missing login/token → missing_credentials hop. Quota language → quota hop.
 *
 * @param options - Mode, optional project/build dir, CLI runner.
 * @returns Effect of provisioned host with public URL.
 * @example
 * await Effect.runPromise(createVercelHost({ mode: 'demo', runCli: mock }));
 */
export const createVercelHost = (
  options: CreateVercelHostOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const runCli = options.runCli ?? defaultVercelCliRunner;
    const projectName = options.projectName ?? defaultLiveWorkProjectName('vybekiit-lw-v');
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';
    const token = options.token;

    let buildDir = options.buildDir;
    if (buildDir === undefined || buildDir.length === 0) {
      if (options.mode === 'buyer') {
        return yield* Effect.fail(
          new HostLiveWorkError({
            code: 'missing_build_dir',
            message: 'Buyer host create needs a build directory (static assets to publish)',
            hopClass: 'missing_credentials',
            provider: 'vercel',
          }),
        );
      }
      const parent =
        options.cwd ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-v-site'));
      mkdirSync(parent, { recursive: true });
      buildDir = writeDemoStaticSite(parent);
    }

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        const whoamiArgs = ['whoami'];
        if (token !== undefined && token.length > 0) {
          whoamiArgs.push('--token', token);
        }
        const whoami = await runCli(whoamiArgs, cwdOpt(options.cwd));
        if (whoami.code !== 0) {
          throw typedCliError(
            'vercel_not_logged_in',
            'missing_credentials',
            whoami.stderr || whoami.stdout || 'vercel whoami failed',
          );
        }

        const deployArgs = ['deploy', buildDir, '--prod', '--yes', '--name', projectName];
        if (token !== undefined && token.length > 0) {
          deployArgs.push('--token', token);
        }
        const deploy = await runCli(deployArgs, cwdOpt(options.cwd));
        if (deploy.code !== 0) {
          throw mapVercelCliFailure(`${deploy.stderr}\n${deploy.stdout}`, 'vercel_deploy_failed');
        }

        const combined = `${deploy.stdout}\n${deploy.stderr}`;
        const url = parseVercelDeployUrl(combined);
        if (url === null) {
          throw typedCliError(
            'vercel_deploy_no_url',
            'hard_stop',
            'Vercel deploy finished without a vercel.app URL',
          );
        }

        return makeProvisionedHost(
          { provider: 'vercel', ephemeral },
          { url, projectId: projectName },
        );
      },
      catch: (cause) => mapVercelCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      yield* verifyHostUrl(provisioned.url, options.fetchImpl ?? globalThis.fetch).pipe(
        Effect.mapError(
          (error) =>
            new HostLiveWorkError({
              code: error.code,
              message: error.message,
              hopClass: error.hopClass,
              provider: 'vercel',
            }),
        ),
      );
    }

    return provisioned;
  });

const cwdOpt = (cwd: string | undefined): { cwd?: string } => (cwd === undefined ? {} : { cwd });

type TypedCliError = Error & {
  readonly hopClass: HostLiveWorkError['hopClass'];
  readonly code: string;
};

/**
 * Attach hop class metadata to a thrown Error.
 *
 * @param code - Stable error code.
 * @param hopClass - Hop classification.
 * @param message - CLI message.
 * @returns Typed error.
 */
const typedCliError = (
  code: string,
  hopClass: HostLiveWorkError['hopClass'],
  message: string,
): TypedCliError => Object.assign(new Error(message), { code, hopClass });

/**
 * Map raw CLI failure text into a typed throw.
 *
 * @param text - stderr/stdout combined.
 * @param defaultCode - Code when not classified as hop.
 * @returns Typed error.
 */
const mapVercelCliFailure = (text: string, defaultCode: string): TypedCliError => {
  const lower = text.toLowerCase();
  if (
    lower.includes('not logged') ||
    lower.includes('no existing credentials') ||
    lower.includes('unauthorized') ||
    lower.includes('authentication') ||
    lower.includes('login') ||
    lower.includes('token')
  ) {
    return typedCliError('vercel_not_logged_in', 'missing_credentials', text.trim() || defaultCode);
  }
  if (
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('too many') ||
    lower.includes('plan')
  ) {
    return typedCliError('vercel_quota', 'quota', text.trim() || defaultCode);
  }
  return typedCliError(defaultCode, 'hard_stop', text.trim() || defaultCode);
};

/**
 * Map thrown values into {@link HostLiveWorkError}.
 *
 * @param cause - Unknown failure.
 * @returns Host Live work error.
 */
const mapVercelCause = (cause: unknown): HostLiveWorkError => {
  if (cause instanceof HostLiveWorkError) {
    return cause;
  }
  const message = cause instanceof Error ? cause.message : 'Vercel host provision failed';
  const hopClass =
    typeof cause === 'object' &&
    cause !== null &&
    'hopClass' in cause &&
    typeof (cause as { hopClass: unknown }).hopClass === 'string'
      ? ((cause as { hopClass: string }).hopClass as HostLiveWorkError['hopClass'])
      : 'hard_stop';
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
      ? (cause as { code: string }).code
      : 'vercel_provision_failed';

  const safeHop: HostLiveWorkError['hopClass'] =
    hopClass === 'quota' ||
    hopClass === 'onboarding_blocked' ||
    hopClass === 'missing_credentials' ||
    hopClass === 'hard_stop'
      ? hopClass
      : 'hard_stop';

  return new HostLiveWorkError({
    code,
    message,
    hopClass: safeHop,
    provider: 'vercel',
  });
};
