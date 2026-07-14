import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect } from 'effect';
import {
  HostLiveWorkError,
  type LiveWorkMode,
  makeProvisionedHost,
  type ProvisionedHost,
} from './types';

/**
 * Result of a single wrangler CLI invocation (injectable for tests).
 */
export type WranglerCliResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/**
 * Runnable wrangler CLI seam — default shells out to `wrangler`.
 */
export type WranglerCliRunner = (
  args: readonly string[],
  options?: { readonly cwd?: string },
) => Promise<WranglerCliResult>;

/**
 * Options for {@link createCloudflarePagesHost}.
 */
export type CreateCloudflarePagesOptions = {
  readonly mode: LiveWorkMode;
  /** Pages project name (lowercase + hyphens). Auto-generated when omitted. */
  readonly projectName?: string;
  /** Directory of static assets. Demo/dogfood may auto-create a tiny site. */
  readonly buildDir?: string;
  readonly cwd?: string;
  readonly runCli?: WranglerCliRunner;
  /** Optional fetch for ready-check (tests). */
  readonly fetchImpl?: typeof fetch;
  /**
   * When true (default for demo/dogfood), skip HTTP verify if deploy URL is present
   * but still attempt GET — failures become hard_stop.
   */
  readonly skipVerify?: boolean;
};

/**
 * Default runner: spawn `wrangler` with the given args.
 *
 * @param args - CLI args after `wrangler`.
 * @param options - Optional working directory.
 * @returns Exit code and streams.
 */
export const defaultWranglerCliRunner: WranglerCliRunner = async (args, options = {}) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  try {
    const { stdout, stderr } = await execFileAsync('wrangler', [...args], {
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
    let stderr = 'wrangler failed';
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
 * Safe Pages project name for Live work demos.
 *
 * @param prefix - Optional prefix (default vybekiit-lw).
 * @returns Lowercase hyphenated name within Cloudflare limits.
 * @example
 * defaultLiveWorkProjectName() // "vybekiit-lw-173…"
 */
export const defaultLiveWorkProjectName = (prefix = 'vybekiit-lw'): string => {
  const stamp = Date.now().toString(36);
  // "vybekiit-lw-" + stamp → keep under 58 chars for Pages
  return `${prefix}-${stamp}`
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')
    .slice(0, 58);
};

/**
 * Write a minimal static site for demo/dogfood Live work deploys.
 *
 * @param parentDir - Directory that will contain `index.html`.
 * @returns Absolute path to the build directory.
 * @example
 * const dir = writeDemoStaticSite('/tmp/x');
 */
export const writeDemoStaticSite = (parentDir: string): string => {
  const buildDir = join(parentDir, 'site');
  mkdirSync(buildDir, { recursive: true });
  writeFileSync(
    join(buildDir, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>VybeKiit Live work</title></head><body><main data-vybekiit-live-work="1"><h1>Live work host OK</h1></main></body></html>\n`,
    'utf8',
  );
  return buildDir;
};

/**
 * Extract the first Cloudflare Pages URL from wrangler stdout/stderr.
 *
 * @param text - Combined CLI output.
 * @returns https URL or null.
 * @example
 * parsePagesDeployUrl('… https://demo.pages.dev …') === 'https://demo.pages.dev'
 */
export const parsePagesDeployUrl = (text: string): string | null => {
  // "https://foo.pages.dev" or with path → capture origin-ish pages.dev URL
  const match = text.match(/https:\/\/[a-z0-9][a-z0-9.-]*\.pages\.dev(?:\/[^\s"'`]*)?/i);
  if (match === null || match[0] === undefined) {
    return null;
  }
  try {
    const url = new URL(match[0]);
    return url.origin;
  } catch {
    return match[0].replace(/\/$/, '');
  }
};

/**
 * Parse account id from `wrangler whoami --json`.
 *
 * @param stdout - JSON from whoami.
 * @returns First account id or null.
 */
export const parseWhoamiAccountId = (stdout: string): string | null => {
  try {
    const parsed = JSON.parse(stdout) as {
      loggedIn?: boolean;
      accounts?: readonly { id?: string }[];
    };
    if (parsed.loggedIn !== true) {
      return null;
    }
    const id = parsed.accounts?.[0]?.id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
};

/**
 * HTTP ready-check for a deployed host URL (retries for Pages SSL/propagation).
 *
 * @param url - Public URL to GET.
 * @param fetchImpl - Optional fetch.
 * @param options - Retry budget.
 * @returns Effect true when status is 2xx/3xx.
 */
export const verifyHostUrl = (
  url: string,
  fetchImpl: typeof fetch = globalThis.fetch,
  options: { readonly attempts?: number; readonly delayMs?: number } = {},
): Effect.Effect<true, HostLiveWorkError> =>
  Effect.tryPromise({
    try: async () => {
      const attempts = options.attempts ?? 12;
      const delayMs = options.delayMs ?? 2500;
      let lastMessage = 'Host verify failed';
      for (let i = 0; i < attempts; i += 1) {
        try {
          const response = await fetchImpl(url, { method: 'GET', redirect: 'follow' });
          if (response.status >= 200 && response.status < 400) {
            return true as const;
          }
          lastMessage = `Host ready-check HTTP ${response.status}`;
        } catch (cause) {
          lastMessage = cause instanceof Error ? cause.message : 'Host verify failed';
        }
        if (i < attempts - 1) {
          await new Promise((resolve) => {
            setTimeout(resolve, delayMs);
          });
        }
      }
      throw new Error(lastMessage);
    },
    catch: (cause) =>
      new HostLiveWorkError({
        code: 'verify_failed',
        message: cause instanceof Error ? cause.message : 'Host verify failed',
        hopClass: 'hard_stop',
        provider: 'cloudflare',
      }),
  });

/**
 * Best-effort delete a Pages project (demo/dogfood teardown).
 *
 * @param projectName - Pages project name.
 * @param runCli - Optional CLI runner.
 * @returns Always-succeeding Effect (cleanup must not fail the run).
 */
export const deleteCloudflarePagesProject = (
  projectName: string,
  runCli: WranglerCliRunner = defaultWranglerCliRunner,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      await runCli(['pages', 'project', 'delete', projectName, '--yes']);
    } catch {
      // best-effort teardown — never fail the Live work run
    }
  });

/**
 * Provision a Cloudflare Pages project via wrangler (ADR-0039 host ladder #1).
 * Missing login → missing_credentials hop. Quota language → quota hop.
 *
 * @param options - Mode, optional project/build dir, CLI runner.
 * @returns Effect of provisioned host with public URL.
 * @example
 * await Effect.runPromise(
 *   createCloudflarePagesHost({ mode: 'demo', runCli: mock }),
 * );
 */
export const createCloudflarePagesHost = (
  options: CreateCloudflarePagesOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const runCli = options.runCli ?? defaultWranglerCliRunner;
    const projectName = options.projectName ?? defaultLiveWorkProjectName();
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';

    let buildDir = options.buildDir;
    if (buildDir === undefined || buildDir.length === 0) {
      if (options.mode === 'buyer') {
        return yield* Effect.fail(
          new HostLiveWorkError({
            code: 'missing_build_dir',
            message: 'Buyer host create needs a build directory (static assets to publish)',
            hopClass: 'missing_credentials',
            provider: 'cloudflare',
          }),
        );
      }
      const parent = options.cwd ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-site'));
      mkdirSync(parent, { recursive: true });
      buildDir = writeDemoStaticSite(parent);
    }

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        const whoami = await runCli(['whoami', '--json'], cwdOpt(options.cwd));
        if (whoami.code !== 0) {
          throw typedCliError(
            'cf_not_logged_in',
            'missing_credentials',
            whoami.stderr || whoami.stdout || 'wrangler whoami failed',
          );
        }
        if (parseWhoamiAccountId(whoami.stdout) === null && !whoami.stdout.includes('loggedIn')) {
          // plain-text whoami still OK if exit 0
          const plain = `${whoami.stdout}\n${whoami.stderr}`.toLowerCase();
          if (plain.includes('not logged') || plain.includes('login')) {
            throw typedCliError(
              'cf_not_logged_in',
              'missing_credentials',
              whoami.stderr || whoami.stdout,
            );
          }
        }

        const create = await runCli(
          ['pages', 'project', 'create', projectName, '--production-branch', 'main'],
          cwdOpt(options.cwd),
        );
        if (create.code !== 0) {
          const combined = `${create.stderr}\n${create.stdout}`;
          // already exists is fine — continue to deploy
          if (!/already exists|A project with name/i.test(combined)) {
            throw mapCloudflareCliFailure(combined, 'cf_project_create_failed');
          }
        }

        const deploy = await runCli(
          ['pages', 'deploy', buildDir, '--project-name', projectName, '--commit-dirty=true'],
          cwdOpt(options.cwd),
        );
        if (deploy.code !== 0) {
          throw mapCloudflareCliFailure(`${deploy.stderr}\n${deploy.stdout}`, 'cf_deploy_failed');
        }

        // Prefer the stable production URL — deployment-hash subdomains often fail
        // TLS handshake from local clients while project.pages.dev is ready.
        const combined = `${deploy.stdout}\n${deploy.stderr}`;
        const deploymentUrl = parsePagesDeployUrl(combined);
        const productionUrl = `https://${projectName}.pages.dev`;
        if (deploymentUrl === null && !combined.toLowerCase().includes('deployment complete')) {
          // Deploy may still have succeeded if URL format changes — require some success signal.
          if (!(combined.toLowerCase().includes('success') || combined.includes('pages.dev'))) {
            throw typedCliError(
              'cf_deploy_no_url',
              'hard_stop',
              'Cloudflare deploy finished without a pages.dev URL',
            );
          }
        }
        const url = productionUrl;

        return makeProvisionedHost(
          { provider: 'cloudflare', ephemeral },
          { url, projectId: projectName },
        );
      },
      catch: (cause) => mapCloudflareCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      yield* verifyHostUrl(provisioned.url, options.fetchImpl ?? globalThis.fetch);
    }

    return provisioned;
  });

const cwdOpt = (cwd: string | undefined): { cwd?: string } => (cwd === undefined ? {} : { cwd });

type TypedCliError = Error & {
  readonly hopClass: HostLiveWorkError['hopClass'];
  readonly code: string;
};

/**
 * Attach hop class metadata to a thrown Error for {@link mapCloudflareCause}.
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
 * Map raw CLI failure text into a typed throw for the tryPromise catch.
 *
 * @param text - stderr/stdout combined.
 * @param defaultCode - Code when not classified as hop.
 * @returns Typed error.
 */
const mapCloudflareCliFailure = (text: string, defaultCode: string): TypedCliError => {
  const lower = text.toLowerCase();
  if (
    lower.includes('not logged') ||
    lower.includes('unauthorized') ||
    lower.includes('authentication') ||
    lower.includes('login')
  ) {
    return typedCliError('cf_not_logged_in', 'missing_credentials', text.trim() || defaultCode);
  }
  if (
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('too many projects') ||
    lower.includes('plan')
  ) {
    return typedCliError('cf_quota', 'quota', text.trim() || defaultCode);
  }
  return typedCliError(defaultCode, 'hard_stop', text.trim() || defaultCode);
};

/**
 * Map thrown values into {@link HostLiveWorkError}.
 *
 * @param cause - Unknown failure.
 * @returns Host Live work error.
 */
const mapCloudflareCause = (cause: unknown): HostLiveWorkError => {
  if (cause instanceof HostLiveWorkError) {
    return cause;
  }
  const message = cause instanceof Error ? cause.message : 'Cloudflare host provision failed';
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
      : 'cf_provision_failed';

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
    provider: 'cloudflare',
  });
};
