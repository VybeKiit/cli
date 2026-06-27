/**
 * The agentic CLI toolchain: the command-line tools the buyer's agent must have
 * present (and signed in) to actually *do* things — create a database, put the app
 * online — without the buyer configuring anything.
 *
 * This module is the **pure** half of `vybekiit doctor` (see ADR-0001): it declares
 * each tool, how to detect it, how to install it per OS, and how to check sign-in —
 * plus the planner and report formatter. Keeping it side-effect-free is what lets the
 * brittle install/auth orchestration be unit-tested instead of trusted. The actual
 * spawning lives in `run.ts`.
 *
 * It is now **provider-aware**: {@link selectToolchain} returns only the CLIs the
 * buyer's *active* adapters need, read from the `*_PROVIDER` env keys. With the
 * defaults (Supabase + Cloudflare) that's exactly `[wrangler, supabase]` — today's
 * behavior, unchanged. Selecting the Mongo data adapter adds the MongoDB Atlas CLI;
 * any active AWS adapter (data / storage / email / auth / hosting) adds the AWS CLI
 * once. Expo/`launch` (mobile) arrive with the mobile template in v2; Playwright with
 * the extension template in v3 — no tool ships before the template/adapter that uses
 * it.
 */

/** OS families we know how to install on. `process.platform` maps onto this. */
export type Platform = 'darwin' | 'win32' | 'linux';

/**
 * How to install one tool on one OS. `requires` names the prerequisite (e.g. a
 * package manager) so a missing one becomes a translatable "install X first" instead
 * of an opaque ENOENT.
 */
export interface InstallStep {
  readonly command: string;
  readonly args: readonly string[];
  readonly requires?: string;
}

/**
 * How to confirm a tool is signed in. We probe by running a harmless authenticated
 * command and reading its exit code — auth lives in each tool's native store, never in
 * `.env` (ADR-0001), so this is the only honest way to check it. `loginHint` is the
 * one plain command the buyer runs when not signed in.
 */
export interface AuthProbe {
  readonly command: string;
  readonly args: readonly string[];
  readonly loginHint: string;
}

/** A single command-line tool in the toolchain. */
export interface Tool {
  /** Identifier + the executable name probed on PATH. */
  readonly name: string;
  /** Plain-language reason the buyer's app needs it (no jargon). */
  readonly purpose: string;
  /** Args that make the tool print its version (used as the presence check). */
  readonly versionArgs: readonly string[];
  readonly install: Readonly<Record<Platform, InstallStep>>;
  /** Absent for tools that need no sign-in. */
  readonly auth?: AuthProbe;
}

/** Default hosting CLI — Cloudflare. Installs the same way everywhere (npm). */
const WRANGLER: Tool = {
  name: 'wrangler',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'wrangler'] },
    win32: { command: 'npm', args: ['install', '-g', 'wrangler'] },
    linux: { command: 'npm', args: ['install', '-g', 'wrangler'] },
  },
  auth: { command: 'wrangler', args: ['whoami'], loginHint: 'wrangler login' },
};

/**
 * Default data CLI — Supabase. Follows Supabase's own guidance (native package
 * managers, not the discouraged npm global), so each OS gets the right channel.
 */
const SUPABASE: Tool = {
  name: 'supabase',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'supabase'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
  },
  auth: { command: 'supabase', args: ['projects', 'list'], loginHint: 'supabase login' },
};

/** MongoDB Atlas CLI — used only when the `mongodb` data adapter is active. */
const ATLAS: Tool = {
  name: 'atlas',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'mongodb-atlas-cli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'mongodb-atlas-cli'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'mongodb-atlas-cli'], requires: 'Homebrew' },
  },
  auth: { command: 'atlas', args: ['auth', 'whoami'], loginHint: 'atlas auth login' },
};

/**
 * AWS CLI — used when any AWS adapter is active (data / storage / email / auth /
 * hosting). One install serves all of them, so {@link selectToolchain} dedupes it.
 */
const AWS: Tool = {
  name: 'aws',
  purpose: 'create and manage your cloud services',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'awscli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'aws'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'awscli'], requires: 'Homebrew' },
  },
  auth: { command: 'aws', args: ['sts', 'get-caller-identity'], loginHint: 'aws configure' },
};

/**
 * The default toolchain (Supabase + Cloudflare) — the result {@link selectToolchain}
 * returns when every `*_PROVIDER` key is at its default. Exported as the stable
 * baseline for callers and tests.
 */
export const TOOLCHAIN: readonly Tool[] = [WRANGLER, SUPABASE];

/**
 * Pick the CLIs the buyer's *active* providers need, read from the `*_PROVIDER` env
 * keys (defaults preserved). The order is hosting → data → AWS, and the AWS CLI is
 * added at most once however many AWS adapters are in use.
 *
 * Returning the tools per active provider — rather than installing every CLI for
 * every backend — is what keeps `doctor` to "no tool before its template/adapter is
 * in use" (ADR-0001): a default web buyer is never asked to install the MongoDB or
 * AWS CLI they'll never touch.
 *
 * @param env - environment source (typically `process.env`)
 */
export function selectToolchain(env: Record<string, string | undefined>): Tool[] {
  const usesAws =
    env.DATA_PROVIDER === 'aws' ||
    env.STORAGE_PROVIDER === 's3' ||
    env.EMAIL_PROVIDER === 'ses' ||
    env.AUTH_PROVIDER === 'cognito' ||
    env.HOSTING_PROVIDER === 'aws';

  const tools: Tool[] = [];
  const add = (tool: Tool): void => {
    if (!tools.includes(tool)) tools.push(tool);
  };

  add(env.HOSTING_PROVIDER === 'aws' ? AWS : WRANGLER);

  switch (env.DATA_PROVIDER) {
    case 'mongodb':
      add(ATLAS);
      break;
    case 'aws':
      add(AWS);
      break;
    default:
      add(SUPABASE);
  }

  if (usesAws) add(AWS);

  return tools;
}

/** Presence of one tool, as observed by the executor. */
export interface ToolPresence {
  readonly tool: string;
  readonly present: boolean;
}

/** One install action the executor should run, with its prerequisite carried along. */
export interface InstallAction extends InstallStep {
  readonly tool: string;
}

/**
 * Given which tools are already present, return the install actions for the ones that
 * are missing — in toolchain order. Idempotent by construction: an already-present tool
 * yields no action, so re-running `doctor` installs nothing.
 */
export function planInstall(
  platform: Platform,
  presence: readonly ToolPresence[],
  tools: readonly Tool[] = TOOLCHAIN,
): InstallAction[] {
  const missing = new Set(presence.filter((p) => !p.present).map((p) => p.tool));
  return tools
    .filter((tool) => missing.has(tool.name))
    .map((tool) => ({ tool: tool.name, ...tool.install[platform] }));
}

/** Final per-tool outcome the report is built from. */
export interface ToolReport {
  readonly tool: string;
  readonly purpose: string;
  /** Present after the provisioning attempt. */
  readonly installed: boolean;
  /** `true`/`false` if the tool needs sign-in, `null` if it doesn't. */
  readonly authed: boolean | null;
  /** Set when `installed` is false — the prerequisite to install first. */
  readonly missingRequirement?: string;
  /** Set when the tool is installed but not signed in. */
  readonly loginHint?: string;
}

/**
 * Render the toolchain outcome as plain, buyer-readable lines the agent can relay or
 * translate. No raw errors, no jargon — each line is a state plus the single next step.
 */
export function formatReport(reports: readonly ToolReport[]): string[] {
  return reports.map((report) => {
    if (!report.installed) {
      const fix = report.missingRequirement
        ? ` Install ${report.missingRequirement} first, then re-run.`
        : ' Re-run to try again.';
      return `✗ ${report.tool} — couldn't be set up (needed to ${report.purpose}).${fix}`;
    }
    if (report.authed === false) {
      return `→ ${report.tool} — installed, but you're not signed in yet. One-time: run \`${report.loginHint}\`.`;
    }
    return `✓ ${report.tool} — ready (used to ${report.purpose}).`;
  });
}

/** True when every tool is installed and any that needs sign-in is signed in. */
export function isToolchainReady(reports: readonly ToolReport[]): boolean {
  return reports.every((report) => report.installed && report.authed !== false);
}
