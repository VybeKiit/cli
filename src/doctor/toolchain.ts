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
 * `gh` is the always-present **base** tool: it's how a published install downloads the
 * template files (it clones the private mirror — ADR-0005) and signs the buyer in to
 * GitHub, so it's needed for *any* template regardless of provider. {@link selectToolchain}
 * always leads with it; the default web set is then `[gh, wrangler, supabase]`.
 *
 * Beyond that base it is **provider-aware**: {@link selectToolchain} returns only the
 * CLIs the buyer's *active* adapters need, read from the `*_PROVIDER` env keys. With the
 * defaults (Supabase + Cloudflare) that's exactly `[gh, wrangler, supabase]` — today's
 * behavior plus the base tool. Selecting the Mongo data adapter adds the MongoDB Atlas CLI;
 * any active AWS adapter (data / storage / email / auth / hosting) adds the AWS CLI
 * once. When the app uses **sign in with Google** the Google Cloud CLI (`gcloud`) is added
 * so the agent can provision the Google OAuth client without the buyer touching the Cloud
 * console. A **mobile** project (passed `mobile: true`) appends the build/publish tools
 * (`eas` + `launch`) on top of the env-selected web tools. Playwright arrives with the
 * extension template in v3 — no tool ships before the template/adapter that uses it.
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
 * GitHub CLI — the always-present base tool. It downloads the buyer's starter files
 * (clones the private template mirror — ADR-0005) and signs them in to GitHub, so it's
 * required for every template no matter the provider. Installs via Homebrew (macOS /
 * Linux) or Scoop (Windows), mirroring the Supabase/Atlas channels; sign-in lives in
 * `gh`'s own store and is probed with `gh auth status`.
 */
const GH: Tool = {
  name: 'gh',
  purpose: "download your app's starter files and sign you in to GitHub",
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'gh'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
  },
  auth: { command: 'gh', args: ['auth', 'status'], loginHint: 'gh auth login --web' },
};

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

/** Opt-in hosting CLI — Vercel (ADR-0006). Installs via npm global on every OS. */
const VERCEL: Tool = {
  name: 'vercel',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'vercel'] },
    win32: { command: 'npm', args: ['install', '-g', 'vercel'] },
    linux: { command: 'npm', args: ['install', '-g', 'vercel'] },
  },
  auth: { command: 'vercel', args: ['whoami'], loginHint: 'vercel login' },
};

/**
 * GitHub CLI — the always-present base tool. It downloads the buyer's starter files
 * (clones the private template mirror — ADR-0005) and signs them in to GitHub, so it's
 * required for every template no matter the provider. Installs via Homebrew (macOS /
 * Linux) or Scoop (Windows), mirroring the Supabase/Atlas channels; sign-in lives in
 * `gh`'s own store and is probed with `gh auth status`.
 */
const GH: Tool = {
  name: 'gh',
  purpose: "download your app's starter files and sign you in to GitHub",
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'gh'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
  },
  auth: { command: 'gh', args: ['auth', 'status'], loginHint: 'gh auth login --web' },
};

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

/** Opt-in hosting CLI — Vercel (ADR-0006). Installs via npm global on every OS. */
const VERCEL: Tool = {
  name: 'vercel',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'vercel'] },
    win32: { command: 'npm', args: ['install', '-g', 'vercel'] },
    linux: { command: 'npm', args: ['install', '-g', 'vercel'] },
  },
  auth: { command: 'vercel', args: ['whoami'], loginHint: 'vercel login' },
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
 * Google Cloud CLI — added only when the app uses **sign in with Google**, so the agent
 * can provision the Google OAuth client (the `GOOGLE_OAUTH_CLIENT_ID` / consent screen)
 * without the buyer opening the Cloud console. Installs via the documented community
 * Homebrew cask (`gcloud-cli`, formerly `google-cloud-sdk`) on macOS/Linux — matching the
 * file's Homebrew-on-Linux channel — and the Scoop `gcloud` manifest on Windows, mirroring
 * the `gh`/`supabase`/`aws` channels. Sign-in lives in gcloud's own store: we probe for an
 * active account with `gcloud auth list`, and the one-time login is the browser device
 * flow `gcloud auth login` (consistent with ADR-0001's interactive-browser-login rule).
 */
const GCLOUD: Tool = {
  name: 'gcloud',
  purpose: 'set up sign in with Google for your app',
  versionArgs: ['--version'],
  install: {
    // `--cask` because gcloud ships as a community cask, not a formula (the file's first cask).
    darwin: { command: 'brew', args: ['install', '--cask', 'gcloud-cli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'gcloud'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', '--cask', 'gcloud-cli'], requires: 'Homebrew' },
  },
  // `auth list` exits non-zero / prints nothing without an active account; login is the browser flow.
  auth: { command: 'gcloud', args: ['auth', 'list'], loginHint: 'gcloud auth login' },
};

/**
 * Claude Code — the primary agent runtime VybeKiit ships for. Installed globally via npm
 * so `vybekiit doctor` can provision it without the buyer hunting installers.
 */
const CLAUDE: Tool = {
  name: 'claude',
  purpose: 'your AI coding assistant (Claude Code)',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
    win32: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
    linux: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
  },
};

/**
 * OpenAI Codex CLI — supported agent runtime alongside Claude Code and Cursor.
 */
const CODEX: Tool = {
  name: 'codex',
  purpose: 'your AI coding assistant (OpenAI Codex)',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
    win32: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
    linux: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
  },
};

/**
 * skills.sh CLI — pins official upstream platform skills into `.agents/skills/` (ADR-0007).
 */
const SKILLS: Tool = {
  name: 'skills',
  purpose: 'install the official platform skills your app needs',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'skills'] },
    win32: { command: 'npm', args: ['install', '-g', 'skills'] },
    linux: { command: 'npm', args: ['install', '-g', 'skills'] },
  },
};

/** Agent-runtime CLIs always checked by doctor (Layer 1 — ADR-0001 update). */
export const AGENT_TOOLS: readonly Tool[] = [CLAUDE, CODEX, SKILLS];

/**
 * EAS CLI — builds a mobile project into an installable app for the stores. Ships
 * only with a mobile project; installs via npm global on every OS. Sign-in is its own
 * native store (an Expo account), probed with `eas whoami`.
 */
const EAS: Tool = {
  name: 'eas',
  purpose: 'build your app for the app stores',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
    win32: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
    linux: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
  },
  auth: { command: 'eas', args: ['whoami'], loginHint: 'eas login' },
};

/**
 * Launch CLI (launch-store) — submits a built app to the App Store and Google Play.
 * Ships only with a mobile project; installs via npm global on every OS. It has no
 * sign-in of its own — it drives the store accounts through the keychain credentials
 * the build tools provision — so no `auth` probe is declared.
 */
const LAUNCH: Tool = {
  name: 'launch',
  purpose: 'publish your app to the app stores',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'launch-store'] },
    win32: { command: 'npm', args: ['install', '-g', 'launch-store'] },
    linux: { command: 'npm', args: ['install', '-g', 'launch-store'] },
  },
};

/**
 * The default toolchain — `gh` (the always-present base tool) plus the default web set
 * (Cloudflare + Supabase). The result {@link selectToolchain} returns when every
 * `*_PROVIDER` key is at its default. Exported as the stable baseline for callers and tests.
 */
export const TOOLCHAIN: readonly Tool[] = [GH, WRANGLER, SUPABASE];

/**
 * Extra context {@link selectToolchain} can't read from the `*_PROVIDER` env keys.
 *
 * @property mobile - true for an Expo project; appends the build/publish tools
 *   (`eas` + `launch`) on top of the env-selected web tools. `run.ts` detects this.
 * @property wantsGoogleAuth - true when the app uses sign in with Google; adds the
 *   `gcloud` CLI so the agent can provision the Google OAuth client. A truthy
 *   `GOOGLE_OAUTH_CLIENT_ID` in the env is treated as the same signal, so callers that
 *   only have the env (not the flag) still get `gcloud`.
 */
export interface ToolchainOptions {
  readonly mobile?: boolean;
  readonly wantsGoogleAuth?: boolean;
}

/**
 * Extra context {@link selectToolchain} can't read from the `*_PROVIDER` env keys.
 *
 * @property mobile - true for an Expo project; appends the build/publish tools
 *   (`eas` + `launch`) on top of the env-selected web tools. `run.ts` detects this.
 */
export interface ToolchainOptions {
  readonly mobile?: boolean;
}

/**
 * Pick the CLIs the buyer's *active* providers need, read from the `*_PROVIDER` env
 * keys (defaults preserved). `gh` always leads — it's the base tool that downloads the
 * template files and signs the buyer in to GitHub (ADR-0005), needed for every template.
 * After it the order is hosting → data → AWS → `gcloud` (when the app uses sign in with
 * Google), then the mobile build/publish tools when this is an Expo project. The AWS CLI
 * is added at most once however many AWS adapters are in use, and `eas`/`launch` are
 * deduped the same way.
 *
 * Returning the per-provider tools on top of the `gh` base — rather than installing
 * every CLI for every backend — is what keeps `doctor` to "no tool before its
 * template/adapter is in use" (ADR-0001): a default web buyer gets `[gh, wrangler,
 * supabase]` and is never asked to install the MongoDB, AWS, or mobile CLIs they'll
 * never touch.
 *
 * @param env - environment source (typically `process.env`)
 * @param options - extra context the env keys don't carry (e.g. mobile project)
 */
export function selectToolchain(
  env: Record<string, string | undefined>,
  options: ToolchainOptions = {},
): Tool[] {
  const usesAws =
    env.DATA_PROVIDER === 'aws' ||
    env.STORAGE_PROVIDER === 's3' ||
    env.EMAIL_PROVIDER === 'ses' ||
    env.AUTH_PROVIDER === 'cognito' ||
    env.HOSTING_PROVIDER === 'aws';

  const tools: Tool[] = [];
  const add = (tool: Tool): void => {
    if (!tools.includes(tool)) {
      tools.push(tool);
    }
  };

  add(GH);
  add(env.HOSTING_PROVIDER === 'aws' ? AWS : env.HOSTING_PROVIDER === 'vercel' ? VERCEL : WRANGLER);

  switch (env.DATA_PROVIDER) {
    case 'mongodb':
      add(ATLAS);
      break;
    case 'aws':
      add(AWS);
      break;
    case 'neon':
    case 'firebase':
    case 'local':
      // MCP-first or zero-config — no Supabase CLI
      break;
    default:
      add(SUPABASE);
  }

  if (usesAws) {
    add(AWS);
  }

  // Sign in with Google needs a provisioned OAuth client; the flag and the env key are
  // the same signal so callers can pass either (e.g. run.ts has only the env at hand).
  if (options.wantsGoogleAuth || env.GOOGLE_OAUTH_CLIENT_ID) {
    add(GCLOUD);
  }

  if (options.mobile) {
    add(EAS);
    add(LAUNCH);
  }

  if (options.mobile) {
    add(EAS);
    add(LAUNCH);
  }

  return tools;
}

/**
 * Merge agent-runtime tools (always) with provider-selected cloud CLIs.
 * Agent tools lead so the report surfaces "your AI assistant" before infra CLIs.
 */
export function mergeAgentAndProviderTools(providerTools: readonly Tool[]): Tool[] {
  const merged: Tool[] = [];
  const add = (tool: Tool): void => {
    if (!merged.some((t) => t.name === tool.name)) {
      merged.push(tool);
    }
  };
  for (const tool of AGENT_TOOLS) {
    add(tool);
  }
  for (const tool of providerTools) {
    add(tool);
  }
  return merged;
}

/** True when at least one agent runtime (Claude Code or Codex) is installed. */
export function isAgentRuntimeReady(reports: readonly ToolReport[]): boolean {
  const claude = reports.find((r) => r.tool === 'claude');
  const codex = reports.find((r) => r.tool === 'codex');
  return Boolean(claude?.installed || codex?.installed);
}

/** True when the skills.sh CLI is installed. */
export function isSkillsCliReady(reports: readonly ToolReport[]): boolean {
  return reports.find((r) => r.tool === 'skills')?.installed ?? false;
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
