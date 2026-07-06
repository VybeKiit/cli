import { spawnSync } from 'node:child_process';

/**
 * Precheck (and auto-install if missing) a provider CLI by delegating to the canonical
 * `vybekiit doctor --ensure <tool>` command — NOT a parallel preflight layer.
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
export interface EnsureCliResult {
  readonly tool: string;
  readonly known: boolean;
  readonly installed: boolean;
  readonly installedNow: boolean;
  readonly authed: boolean | null;
  readonly loginHint?: string;
  readonly missingRequirement?: string;
}

/** Command used to invoke the vybekiit CLI. Override in tests via {@link EnsureCliOptions}. */
export interface EnsureCliOptions {
  /** Executable + leading args (default: `npx vybekiit`). */
  readonly bin?: readonly string[];
  readonly log?: Pick<Console, 'log' | 'warn'>;
}

const DEFAULT_BIN = ['npx', 'vybekiit'] as const;

export function ensureCli(tool: string, options: EnsureCliOptions = {}): EnsureCliResult {
  const bin = options.bin ?? DEFAULT_BIN;
  const log = options.log ?? console;
  const [command, ...leading] = bin;
  if (!command) {
    return { tool, known: false, installed: false, installedNow: false, authed: null };
  }

  log.log(`[automate] ensuring CLI "${tool}" via ${bin.join(' ')} doctor --ensure`);
  const result = spawnSync(command, [...leading, 'doctor', '--ensure', tool, '--json'], {
    encoding: 'utf8',
  });

  const stdout = result.stdout ?? '';
  const jsonLine = stdout
    .split('\n')
    .reverse()
    .find((line) => line.trim().startsWith('{'));

  if (!jsonLine) {
    return { tool, known: false, installed: false, installedNow: false, authed: null };
  }

  try {
    const parsed = JSON.parse(jsonLine) as EnsureCliResult & { ok?: boolean };
    return {
      tool: parsed.tool ?? tool,
      known: parsed.known ?? false,
      installed: parsed.installed ?? false,
      installedNow: parsed.installedNow ?? false,
      authed: parsed.authed ?? null,
      ...(parsed.loginHint ? { loginHint: parsed.loginHint } : {}),
      ...(parsed.missingRequirement ? { missingRequirement: parsed.missingRequirement } : {}),
    };
  } catch {
    return { tool, known: false, installed: false, installedNow: false, authed: null };
  }
}
