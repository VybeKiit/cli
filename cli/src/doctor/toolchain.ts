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
 * v1 ships the web toolchain only (`supabase` + `wrangler`). Expo/`launch` (mobile)
 * arrive with the mobile template in v2; Playwright with the extension template in v3.
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

/**
 * The v1 web toolchain. `wrangler` installs the same way everywhere (npm); `supabase`
 * follows Supabase's own guidance — native package managers, not the discouraged npm
 * global — so each OS gets the right channel.
 */
export const TOOLCHAIN: readonly Tool[] = [
  {
    name: 'wrangler',
    purpose: 'put your app online',
    versionArgs: ['--version'],
    install: {
      darwin: { command: 'npm', args: ['install', '-g', 'wrangler'] },
      win32: { command: 'npm', args: ['install', '-g', 'wrangler'] },
      linux: { command: 'npm', args: ['install', '-g', 'wrangler'] },
    },
    auth: { command: 'wrangler', args: ['whoami'], loginHint: 'wrangler login' },
  },
  {
    name: 'supabase',
    purpose: 'create and manage your database',
    versionArgs: ['--version'],
    install: {
      darwin: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
      win32: { command: 'scoop', args: ['install', 'supabase'], requires: 'Scoop' },
      linux: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
    },
    auth: { command: 'supabase', args: ['projects', 'list'], loginHint: 'supabase login' },
  },
];

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
