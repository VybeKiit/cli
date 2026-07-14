import { Effect } from 'effect';
import { LiveWorkError, makeProvisioned, type ProvisionedData } from './types';

/**
 * Result of a single Railway CLI invocation (injectable for tests).
 */
export type RailwayCliResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

/**
 * Runnable Railway CLI seam — default shells out to `railway`.
 */
export type RailwayCliRunner = (
  args: readonly string[],
  options?: { readonly cwd?: string },
) => Promise<RailwayCliResult>;

/**
 * Options for {@link createRailwayPostgres}.
 */
export type CreateRailwayPostgresOptions = {
  readonly cwd?: string;
  readonly runCli?: RailwayCliRunner;
  /**
   * Project name for `railway init` when the cwd is not linked.
   * Defaults to `vybekiit-lw-<timestamp>`.
   */
  readonly projectName?: string;
  /**
   * Poll interval (ms) when waiting for DATABASE_URL after add.
   * @default 2000
   */
  readonly pollMs?: number;
  /**
   * Max polls for variables after postgres add.
   * @default 15
   */
  readonly maxPolls?: number;
};

/**
 * Default runner: spawn `railway` with the given args (Node child_process).
 *
 * @param args - CLI args after `railway`.
 * @param options - Optional working directory.
 * @returns Exit code and combined streams.
 */
export const defaultRailwayCliRunner: RailwayCliRunner = async (args, options = {}) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  try {
    const { stdout, stderr } = await execFileAsync('railway', [...args], {
      cwd: options.cwd,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
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
    const exitCode = typeof err.code === 'number' ? err.code : 1;
    let stderr = 'railway failed';
    if (typeof err.stderr === 'string') {
      stderr = err.stderr;
    } else if (typeof err.message === 'string') {
      stderr = err.message;
    }
    return {
      code: exitCode,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr,
    };
  }
};

/**
 * Read a string field from a JSON object.
 *
 * @param record - Parsed object.
 * @param key - Field name.
 * @returns Non-empty string or null.
 */
const readStringField = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

/**
 * Parse a connectable DATABASE URL from `railway variables --json` stdout.
 * Prefers `DATABASE_PUBLIC_URL` (works outside Railway private network), then
 * `DATABASE_URL`.
 *
 * @param stdout - JSON object or array from Railway CLI.
 * @returns Connection string when present.
 * @example
 * parseRailwayDatabaseUrl(JSON.stringify({ DATABASE_PUBLIC_URL: 'postgresql://…' }));
 */
export const parseRailwayDatabaseUrl = (stdout: string): string | null => {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      let publicUrl: string | null = null;
      let privateUrl: string | null = null;
      for (const entry of parsed) {
        if (typeof entry !== 'object' || entry === null) {
          continue;
        }
        const row = entry as { name?: unknown; value?: unknown };
        if (
          typeof row.name !== 'string' ||
          typeof row.value !== 'string' ||
          row.value.length === 0
        ) {
          continue;
        }
        if (row.name === 'DATABASE_PUBLIC_URL') {
          publicUrl = row.value;
        } else if (row.name === 'DATABASE_URL') {
          privateUrl = row.value;
        }
      }
      return publicUrl ?? privateUrl;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      return (
        readStringField(record, 'DATABASE_PUBLIC_URL') ?? readStringField(record, 'DATABASE_URL')
      );
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Parse project id from `railway init --json` stdout.
 *
 * @param stdout - JSON with id/name.
 * @returns Project id when present.
 */
export const parseRailwayInitProjectId = (stdout: string): string | null => {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) {
    return null;
  }
  // CLI may print interactive lines before the JSON object.
  const brace = trimmed.lastIndexOf('{');
  if (brace < 0) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed.slice(brace));
    if (typeof parsed === 'object' && parsed !== null && 'id' in parsed) {
      const id = (parsed as { id: unknown }).id;
      return typeof id === 'string' && id.length > 0 ? id : null;
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * True when `railway status` shows a linked project for this cwd.
 *
 * @param stdout - status stdout.
 * @param stderr - status stderr.
 * @param code - exit code.
 * @returns Whether a project is linked.
 */
export const isRailwayStatusLinked = (code: number, stdout: string, stderr: string): boolean => {
  const blob = `${stdout} ${stderr}`.toLowerCase();
  if (
    blob.includes('no linked project') ||
    blob.includes('run `railway link`') ||
    blob.includes('run railway link')
  ) {
    return false;
  }
  if (code !== 0) {
    return false;
  }
  return blob.includes('project') && !blob.includes('no linked');
};

/**
 * Sleep helper (overridable via poll only in production path).
 *
 * @param ms - Milliseconds.
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * True when Railway rejects create for workspace project rate limits.
 *
 * @param blob - Combined stderr/stdout (any case).
 * @returns Whether this is a temporary rate-limit signal.
 */
const isRailwayRateLimited = (blob: string): boolean => {
  const lower = blob.toLowerCase();
  return (
    lower.includes('too quickly') ||
    lower.includes('try again shortly') ||
    lower.includes('1 project per')
  );
};

/**
 * Provision Railway Postgres via CLI when the builder is logged in (ADR-0039 data
 * ladder third rung). If the cwd is not linked, creates a project with
 * `railway init --name … --json`, then `add --database postgres`.
 *
 * Missing CLI/login → missing_credentials hop. Prefer public DATABASE URL so
 * local verify (SELECT 1) works outside Railway's private network.
 *
 * @param options - Cwd, project name, optional CLI runner.
 * @returns Effect of provisioned railway data or hop-classed LiveWorkError.
 * @example
 * await Effect.runPromise(createRailwayPostgres({ cwd: projectDir, runCli: mock }));
 */
export const createRailwayPostgres = (
  options: CreateRailwayPostgresOptions = {},
): Effect.Effect<ProvisionedData, LiveWorkError> =>
  Effect.tryPromise({
    try: async () => {
      const runCli = options.runCli ?? defaultRailwayCliRunner;
      const cwd = options.cwd;
      const cliOpts = cwd === undefined ? {} : { cwd };
      const pollMs = options.pollMs ?? 2000;
      const maxPolls = options.maxPolls ?? 15;

      const whoami = await runCli(['whoami'], cliOpts);
      if (whoami.code !== 0) {
        throw Object.assign(new Error(whoami.stderr || whoami.stdout || 'railway whoami failed'), {
          hopClass: 'missing_credentials' as const,
          code: 'railway_not_logged_in',
        });
      }

      const status = await runCli(['status'], cliOpts);
      if (!isRailwayStatusLinked(status.code, status.stdout, status.stderr)) {
        const projectName = options.projectName ?? `vybekiit-lw-${Date.now().toString(36)}`;
        // Workspace rate-limit: 1 project / 30s — one retry after a short wait.
        let init = await runCli(['init', '--name', projectName, '--json'], cliOpts);
        if (init.code !== 0 && isRailwayRateLimited(`${init.stderr} ${init.stdout}`)) {
          await delay(35_000);
          init = await runCli(['init', '--name', projectName, '--json'], cliOpts);
        }
        if (init.code !== 0) {
          const lower = `${init.stderr} ${init.stdout}`.toLowerCase();
          if (
            lower.includes('not logged') ||
            lower.includes('login') ||
            lower.includes('unauthorized')
          ) {
            throw Object.assign(new Error(init.stderr || init.stdout || 'railway not logged in'), {
              hopClass: 'missing_credentials' as const,
              code: 'railway_not_logged_in',
            });
          }
          if (isRailwayRateLimited(`${init.stderr} ${init.stdout}`)) {
            throw Object.assign(new Error(init.stderr || init.stdout || 'railway rate limited'), {
              hopClass: 'quota' as const,
              code: 'railway_rate_limited',
            });
          }
          throw Object.assign(new Error(init.stderr || init.stdout || 'railway init failed'), {
            hopClass: 'hard_stop' as const,
            code: 'railway_init_failed',
          });
        }
      }

      const add = await runCli(['add', '--database', 'postgres', '--json'], cliOpts);
      if (add.code !== 0) {
        const lower = `${add.stderr} ${add.stdout}`.toLowerCase();
        if (
          lower.includes('not logged') ||
          lower.includes('login') ||
          lower.includes('unauthorized')
        ) {
          throw Object.assign(new Error(add.stderr || add.stdout || 'railway not logged in'), {
            hopClass: 'missing_credentials' as const,
            code: 'railway_not_logged_in',
          });
        }
        if (lower.includes('no linked') || lower.includes('not linked')) {
          throw Object.assign(new Error(add.stderr || add.stdout || 'railway not linked'), {
            hopClass: 'missing_credentials' as const,
            code: 'railway_not_linked',
          });
        }
        if (lower.includes('quota') || lower.includes('limit') || lower.includes('plan')) {
          throw Object.assign(new Error(add.stderr || add.stdout || 'railway quota'), {
            hopClass: 'quota' as const,
            code: 'railway_quota',
          });
        }
        throw Object.assign(new Error(add.stderr || add.stdout || 'railway add failed'), {
          hopClass: 'hard_stop' as const,
          code: 'railway_add_failed',
        });
      }

      let databaseUrl: string | null = null;
      for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        const variables = await runCli(['variables', '--json'], cliOpts);
        if (variables.code === 0) {
          databaseUrl = parseRailwayDatabaseUrl(variables.stdout);
          if (databaseUrl !== null) {
            break;
          }
        }
        if (attempt < maxPolls - 1) {
          await delay(pollMs);
        }
      }

      if (databaseUrl === null) {
        throw Object.assign(
          new Error(
            'Railway variables missing DATABASE_URL / DATABASE_PUBLIC_URL after postgres add',
          ),
          {
            hopClass: 'hard_stop' as const,
            code: 'railway_missing_database_url',
          },
        );
      }

      return makeProvisioned({ provider: 'railway', ephemeral: false }, { databaseUrl });
    },
    catch: (cause) => mapRailwayFailure(cause),
  });

/**
 * Best-effort delete a Railway project (dogfood / e2e teardown).
 *
 * @param projectIdOrName - Project id or name.
 * @param options - Optional CLI runner / cwd.
 * @returns Effect that always succeeds (logs-ish via result flag).
 * @example
 * await Effect.runPromise(deleteRailwayProject('vybekiit-lw-demo'));
 */
export const deleteRailwayProject = (
  projectIdOrName: string,
  options: { readonly runCli?: RailwayCliRunner; readonly cwd?: string } = {},
): Effect.Effect<{ readonly deleted: boolean }, never> =>
  Effect.tryPromise({
    try: async () => {
      const runCli = options.runCli ?? defaultRailwayCliRunner;
      const cliOpts = options.cwd === undefined ? {} : { cwd: options.cwd };
      const result = await runCli(
        ['delete', '--project', projectIdOrName, '--yes', '--json'],
        cliOpts,
      );
      return { deleted: result.code === 0 };
    },
    catch: () => ({ deleted: false }),
  }).pipe(Effect.catchAll(() => Effect.succeed({ deleted: false })));

/**
 * Map Railway CLI failures into hop-classed {@link LiveWorkError}.
 *
 * @param cause - Thrown value from the provision try.
 * @returns Classified Live work error.
 */
const mapRailwayFailure = (cause: unknown): LiveWorkError => {
  const message = cause instanceof Error ? cause.message : 'Railway provision failed';
  const hopClass =
    typeof cause === 'object' &&
    cause !== null &&
    'hopClass' in cause &&
    typeof (cause as { hopClass: unknown }).hopClass === 'string'
      ? ((cause as { hopClass: string }).hopClass as LiveWorkError['hopClass'])
      : 'hard_stop';
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
      ? (cause as { code: string }).code
      : 'railway_provision_failed';

  const safeHop: LiveWorkError['hopClass'] =
    hopClass === 'quota' ||
    hopClass === 'onboarding_blocked' ||
    hopClass === 'missing_credentials' ||
    hopClass === 'hard_stop'
      ? hopClass
      : 'hard_stop';

  return new LiveWorkError({
    code,
    message,
    hopClass: safeHop,
    provider: 'railway',
  });
};
