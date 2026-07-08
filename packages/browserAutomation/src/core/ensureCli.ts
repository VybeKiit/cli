import { spawnSync } from 'node:child_process';
import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { Either, Schema } from 'effect';

/**
 * Precheck (and auto-install if missing) a provider CLI by delegating to the canonical
 * `vybekiit doctor --ensure <tool>` command - NOT a parallel preflight layer.
 *
 * `browserAutomation` is a library and `vybekiit` (the CLI) is the top-level app; importing
 * the app here would invert layering and risk a dependency cycle. So we shell out to the
 * published bin instead. The toolchain declarations, per-OS install steps, and auth probes
 * all live in one place (`cli/src/doctor/toolchain.ts`), reused by both the full sweep and
 * this single-tool call.
 *
 * A provider `setup` runs this first; only when the ensured CLI has no token-mint path does
 * it fall through to browser automation.
 */
export const EnsureCliResultSchema = Schema.Struct({
  authed: Schema.Union(Schema.Boolean, Schema.Null),
  installed: Schema.Boolean,
  installedNow: Schema.Boolean,
  known: Schema.Boolean,
  loginHint: Schema.optional(Schema.String),
  missingRequirement: Schema.optional(Schema.String),
  tool: Schema.String,
});

export type EnsureCliResult = Schema.Schema.Type<typeof EnsureCliResultSchema>;

/** Command used to invoke the vybekiit CLI. Override in tests via {@link EnsureCliOptions}. */
export type EnsureCliOptions = {
  /** Executable + leading args (default: `npx vybekiit`). */
  readonly bin?: readonly string[];
  readonly log?: Pick<VerbLogger, 'log' | 'warn'>;
};

const DEFAULT_BIN = ['npx', 'vybekiit'] as const;

const DoctorEnsureCliResultSchema = Schema.Struct({
  authed: Schema.optional(Schema.Union(Schema.Boolean, Schema.Null)),
  installed: Schema.optional(Schema.Boolean),
  installedNow: Schema.optional(Schema.Boolean),
  known: Schema.optional(Schema.Boolean),
  loginHint: Schema.optional(Schema.String),
  missingRequirement: Schema.optional(Schema.String),
  tool: Schema.optional(Schema.String),
});

type DoctorEnsureCliResult = Schema.Schema.Type<typeof DoctorEnsureCliResultSchema>;

/**
 * Build the safe unknown result for missing or invalid doctor output.
 *
 * @param tool - Toolchain key that was requested.
 * @returns A non-throwing result that marks the tool unknown.
 * @example
 * const result = unknownEnsureCliResult('wrangler');
 */
const unknownEnsureCliResult = (tool: string): EnsureCliResult => ({
  tool,
  known: false,
  installed: false,
  installedNow: false,
  authed: null,
});

/**
 * Normalize a decoded doctor payload into the public result shape.
 *
 * @param tool - Toolchain key requested by the caller.
 * @param parsed - Decoded doctor payload with optional fields.
 * @returns The complete CLI precheck result.
 * @example
 * const result = normalizeDoctorEnsureCliResult('wrangler', { known: true });
 */
const normalizeDoctorEnsureCliResult = (
  tool: string,
  parsed: DoctorEnsureCliResult,
): EnsureCliResult => ({
  tool: parsed.tool === undefined ? tool : parsed.tool,
  known: parsed.known === true,
  installed: parsed.installed === true,
  installedNow: parsed.installedNow === true,
  authed: parsed.authed === undefined ? null : parsed.authed,
  ...(parsed.loginHint === undefined ? {} : { loginHint: parsed.loginHint }),
  ...(parsed.missingRequirement === undefined
    ? {}
    : { missingRequirement: parsed.missingRequirement }),
});

/**
 * Decode and normalize raw doctor JSON.
 *
 * @param tool - Toolchain key requested by the caller.
 * @param raw - Parsed JSON value emitted by the doctor command.
 * @returns The normalized CLI precheck result, or an unknown result on schema mismatch.
 * @example
 * const result = parseDoctorEnsureCliResult('wrangler', { known: true });
 */
const parseDoctorEnsureCliResult = (tool: string, raw: unknown): EnsureCliResult => {
  const parsed = Schema.decodeUnknownEither(DoctorEnsureCliResultSchema)(raw);

  if (Either.isLeft(parsed)) {
    return unknownEnsureCliResult(tool);
  }

  return normalizeDoctorEnsureCliResult(tool, parsed.right);
};

/**
 * Ensure a provider CLI exists by delegating to `vybekiit doctor --ensure`.
 *
 * @param tool - Toolchain key to verify.
 * @param options - Optional command and logger overrides, mainly for tests.
 * @returns The normalized CLI precheck result.
 * @example
 * const result = ensureCli('wrangler', { bin: ['pnpm', 'vybekiit'] });
 */
export const ensureCli = (tool: string, options: EnsureCliOptions = {}): EnsureCliResult => {
  const bin = options.bin === undefined ? DEFAULT_BIN : options.bin;
  const log = options.log === undefined ? console : options.log;
  const [command, ...leading] = bin;
  if (command === undefined) {
    return unknownEnsureCliResult(tool);
  }

  log.log(`[automate] ensuring CLI "${tool}" via ${bin.join(' ')} doctor --ensure`);
  const result = spawnSync(command, [...leading, 'doctor', '--ensure', tool, '--json'], {
    encoding: 'utf8',
  });

  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const jsonLine = stdout
    .split('\n')
    .reverse()
    .find((line) => line.trim().startsWith('{'));

  if (jsonLine === undefined) {
    return unknownEnsureCliResult(tool);
  }

  try {
    return parseDoctorEnsureCliResult(tool, JSON.parse(jsonLine));
  } catch {
    return unknownEnsureCliResult(tool);
  }
};
