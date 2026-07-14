import { mkdirSync, writeFileSync } from 'node:fs';
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
 * Result of a single Railway CLI invocation (injectable for tests).
 */
export type RailwayHostCliResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/**
 * Runnable Railway CLI seam for host create — default shells out to `railway`.
 */
export type RailwayHostCliRunner = (
  args: readonly string[],
  options?: { readonly cwd?: string },
) => Promise<RailwayHostCliResult>;

/**
 * Options for {@link createRailwayHost}.
 */
export type CreateRailwayHostOptions = {
  readonly mode: LiveWorkMode;
  readonly projectName?: string;
  readonly buildDir?: string;
  readonly cwd?: string;
  readonly runCli?: RailwayHostCliRunner;
  readonly fetchImpl?: typeof fetch;
  readonly skipVerify?: boolean;
};

/**
 * Default runner: spawn `railway` with the given args.
 *
 * @param args - CLI args after `railway`.
 * @param options - Optional working directory.
 * @returns Exit code and streams.
 */
export const defaultRailwayHostCliRunner: RailwayHostCliRunner = async (args, options = {}) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  try {
    const { stdout, stderr } = await execFileAsync('railway', [...args], {
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
    let stderr = 'railway failed';
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
 * Extract a public Railway URL from CLI output.
 *
 * @param text - Combined CLI output.
 * @returns https URL or null.
 * @example
 * parseRailwayHostUrl('… https://app.up.railway.app …')
 */
export const parseRailwayHostUrl = (text: string): string | null => {
  // railway.app / up.railway.app / custom railway domains
  const match = text.match(
    /https:\/\/[a-z0-9][a-z0-9.-]*(?:\.up\.railway\.app|\.railway\.app)(?:\/[^\s"'`]*)?/i,
  );
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
 * Best-effort unlink / skip delete (Railway project delete needs interactive confirm).
 * Demo teardown is best-effort via `railway down` when available.
 *
 * @param runCli - CLI runner.
 * @param cwd - Linked project directory.
 * @returns Always-succeeding Effect.
 */
export const teardownRailwayHost = (
  runCli: RailwayHostCliRunner = defaultRailwayHostCliRunner,
  cwd?: string,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      await runCli(['down', '--yes'], cwd === undefined ? {} : { cwd });
    } catch {
      // best-effort
    }
  });

/**
 * Provision a Railway host via CLI (ADR-0039 host ladder #3).
 * Missing login/link → missing_credentials hop. Quota language → quota hop.
 *
 * Steps: `whoami` → `init` (when needed) → `up --detach` → parse public URL.
 *
 * @param options - Mode, optional project/build dir, CLI runner.
 * @returns Effect of provisioned host with public URL.
 * @example
 * await Effect.runPromise(createRailwayHost({ mode: 'demo', runCli: mock }));
 */
export const createRailwayHost = (
  options: CreateRailwayHostOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const runCli = options.runCli ?? defaultRailwayHostCliRunner;
    const projectName = options.projectName ?? defaultLiveWorkProjectName('vybekiit-lw-r');
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';

    let workDir = options.cwd;
    let buildDir = options.buildDir;
    if (buildDir === undefined || buildDir.length === 0) {
      if (options.mode === 'buyer') {
        return yield* Effect.fail(
          new HostLiveWorkError({
            code: 'missing_build_dir',
            message: 'Buyer host create needs a build directory (app to publish)',
            hopClass: 'missing_credentials',
            provider: 'railway',
          }),
        );
      }
      workDir = workDir ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-r-site'));
      mkdirSync(workDir, { recursive: true });
      buildDir = writeDemoStaticSite(workDir);
      // Minimal Dockerfile-less static: add package.json so nixpacks has something
      writeFileSync(
        join(workDir, 'package.json'),
        JSON.stringify({
          name: projectName,
          private: true,
          scripts: { start: 'npx serve site -l $PORT' },
        }),
        'utf8',
      );
    }

    const deployCwd = workDir ?? buildDir;

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        const whoami = await runCli(['whoami'], cwdOpt(deployCwd));
        if (whoami.code !== 0) {
          throw typedCliError(
            'railway_not_logged_in',
            'missing_credentials',
            whoami.stderr || whoami.stdout || 'railway whoami failed',
          );
        }

        const init = await runCli(['init', '--name', projectName], cwdOpt(deployCwd));
        if (init.code !== 0) {
          const combined = `${init.stderr}\n${init.stdout}`;
          // already linked / exists can still proceed
          if (!/already|exists|linked/i.test(combined)) {
            throw mapRailwayCliFailure(combined, 'railway_init_failed');
          }
        }

        const up = await runCli(['up', '--detach'], cwdOpt(deployCwd));
        if (up.code !== 0) {
          throw mapRailwayCliFailure(`${up.stderr}\n${up.stdout}`, 'railway_up_failed');
        }

        const domain = await runCli(['domain'], cwdOpt(deployCwd));
        const combined = `${up.stdout}\n${up.stderr}\n${domain.stdout}\n${domain.stderr}`;
        const url = parseRailwayHostUrl(combined);
        if (url === null) {
          // Deploy may succeed without public domain yet — treat as hard_stop with guidance.
          throw typedCliError(
            'railway_deploy_no_url',
            'hard_stop',
            'Railway deploy finished without a public URL (generate a domain on the service)',
          );
        }

        return makeProvisionedHost(
          { provider: 'railway', ephemeral },
          { url, projectId: projectName },
        );
      },
      catch: (cause) => mapRailwayHostCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      yield* verifyHostUrl(provisioned.url, options.fetchImpl ?? globalThis.fetch).pipe(
        Effect.mapError(
          (error) =>
            new HostLiveWorkError({
              code: error.code,
              message: error.message,
              hopClass: error.hopClass,
              provider: 'railway',
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
const mapRailwayCliFailure = (text: string, defaultCode: string): TypedCliError => {
  const lower = text.toLowerCase();
  if (
    lower.includes('not logged') ||
    lower.includes('unauthorized') ||
    lower.includes('login') ||
    lower.includes('no linked') ||
    lower.includes('not linked') ||
    (lower.includes('not found') && lower.includes('railway'))
  ) {
    return typedCliError(
      'railway_not_logged_in',
      'missing_credentials',
      text.trim() || defaultCode,
    );
  }
  if (
    lower.includes('quota') ||
    lower.includes('limit exceeded') ||
    lower.includes('resource provision limit') ||
    lower.includes('free plan') ||
    lower.includes('upgrade to provision') ||
    (lower.includes('limit') && lower.includes('plan'))
  ) {
    return typedCliError('railway_quota', 'quota', text.trim() || defaultCode);
  }
  return typedCliError(defaultCode, 'hard_stop', text.trim() || defaultCode);
};

/**
 * Map thrown values into {@link HostLiveWorkError}.
 *
 * @param cause - Unknown failure.
 * @returns Host Live work error.
 */
const mapRailwayHostCause = (cause: unknown): HostLiveWorkError => {
  if (cause instanceof HostLiveWorkError) {
    return cause;
  }
  const message = cause instanceof Error ? cause.message : 'Railway host provision failed';
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
      : 'railway_host_provision_failed';

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
    provider: 'railway',
  });
};
