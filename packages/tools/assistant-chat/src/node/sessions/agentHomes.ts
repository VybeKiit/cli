import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Read a non-empty env override, or null when unset/blank.
 *
 * @param name - Environment variable name.
 * @param env - Env map (defaults to `process.env`; injectable for tests).
 * @returns Trimmed value or null.
 */
const envPath = (name: string, env: NodeJS.ProcessEnv = process.env): string | null => {
  const raw = env[name];
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * User home directory. Node's `os.homedir()` resolves correctly on:
 * - macOS / Linux / Ubuntu: `$HOME`
 * - Windows: `%USERPROFILE%` (or HOMEDRIVE+HOMEPATH)
 * - WSL: the Linux home inside the distro
 *
 * @param env - Unused; kept for API symmetry with other resolvers.
 * @returns Absolute home path.
 */
export const resolveUserHome = (_env: NodeJS.ProcessEnv = process.env): string => homedir();

/**
 * Claude Code config root.
 * Official default: `~/.claude` (Windows: `%USERPROFILE%\.claude`).
 * Override: `CLAUDE_CONFIG_DIR` (moves settings, session history, plugins).
 *
 * @see https://code.claude.com/docs/en/claude-directory
 * @see https://code.claude.com/docs/en/env-vars
 * @param env - Env map.
 * @returns Absolute Claude config directory.
 * @example
 * resolveClaudeHome(); // '/Users/me/.claude'
 * resolveClaudeHome({ CLAUDE_CONFIG_DIR: '/tmp/claude' }); // '/tmp/claude'
 */
export const resolveClaudeHome = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = envPath('CLAUDE_CONFIG_DIR', env);
  if (override !== null) {
    return override;
  }
  return join(resolveUserHome(env), '.claude');
};

/**
 * OpenAI Codex CLI home.
 * Official default: `~/.codex` (Windows: `%USERPROFILE%\.codex`).
 * Override: `CODEX_HOME`.
 *
 * @see https://developers.openai.com/codex/cli/reference
 * @param env - Env map.
 * @returns Absolute Codex home directory.
 * @example
 * resolveCodexHome(); // '~/.codex'
 */
export const resolveCodexHome = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = envPath('CODEX_HOME', env);
  if (override !== null) {
    return override;
  }
  return join(resolveUserHome(env), '.codex');
};

/**
 * Grok Build CLI home.
 * Official: `~/.grok` on macOS/Linux; `%USERPROFILE%\.grok` on Windows.
 * No documented home override env as of 2026-07.
 *
 * @see https://docs.x.ai/build/overview
 * @param env - Env map.
 * @returns Absolute Grok home directory.
 * @example
 * resolveGrokHome(); // '~/.grok'
 */
export const resolveGrokHome = (env: NodeJS.ProcessEnv = process.env): string =>
  join(resolveUserHome(env), '.grok');

/**
 * Cursor local state root (CLI agent-transcripts live under `projects/`).
 * Official community/docs: `~/.cursor/projects/...` on macOS and Linux;
 * Windows/WSL uses the same layout under the user home (`%USERPROFILE%\.cursor`
 * natively, or Linux home under WSL — Cursor CLI docs recommend WSL on Windows).
 *
 * @param env - Env map.
 * @returns Absolute Cursor home directory.
 * @example
 * resolveCursorHome(); // '~/.cursor'
 */
export const resolveCursorHome = (env: NodeJS.ProcessEnv = process.env): string =>
  join(resolveUserHome(env), '.cursor');

/**
 * Kimi Code CLI data root.
 * Official default: `~/.kimi-code/`. Override: `KIMI_CODE_HOME`.
 *
 * @see https://platform.kimi.ai/docs/guide/kimi-cli-support
 * @param env - Env map.
 * @returns Absolute Kimi Code home directory.
 * @example
 * resolveKimiHome({ KIMI_CODE_HOME: 'D:\\kimi' }); // 'D:\\kimi'
 */
export const resolveKimiHome = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = envPath('KIMI_CODE_HOME', env);
  if (override !== null) {
    return override;
  }
  return join(resolveUserHome(env), '.kimi-code');
};

/**
 * Kiro CLI global home.
 * Official default: `~/.kiro`. Override: `KIRO_HOME` (redirects agents, sessions,
 * settings, skills — project-local `.kiro/` is unaffected).
 *
 * @see https://kiro.dev/docs/cli/chat/configuration
 * @param env - Env map.
 * @returns Absolute Kiro home directory.
 * @example
 * resolveKiroHome(); // '~/.kiro'
 */
export const resolveKiroHome = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = envPath('KIRO_HOME', env);
  if (override !== null) {
    return override;
  }
  return join(resolveUserHome(env), '.kiro');
};

/**
 * Whether the current process looks like native Windows (not WSL).
 * WSL reports `linux` for `process.platform` and stores data under the Linux home.
 *
 * @param platform - Optional override for tests (`process.platform` by default).
 * @returns True on win32.
 */
export const isNativeWindows = (platform: NodeJS.Platform = process.platform): boolean =>
  platform === 'win32';

/**
 * Devin CLI per-user data directory candidates (sessions.db, transcripts, logs).
 *
 * Official docs:
 * - macOS / Linux: `~/.local/share/devin/cli/...`
 * - Windows: `%APPDATA%\devin\cli/...`
 * - When `XDG_DATA_HOME` is set (Linux/desktop): `$XDG_DATA_HOME/devin/cli/...`
 *
 * Returns every plausible root so Resume works if the user set XDG or runs
 * mixed tooling; callers should try in order and use the first hit.
 *
 * @see https://docs.devin.ai/cli/troubleshooting
 * @param env - Env map.
 * @param platform - Platform for Windows vs Unix layout.
 * @returns Ordered absolute paths to the `devin/cli` data dir (no trailing file).
 * @example
 * resolveDevinCliDataDirs()[0]; // '.../.local/share/devin/cli' or APPDATA
 */
export const resolveDevinCliDataDirs = (
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] => {
  const dirs: string[] = [];
  const seen = new Set<string>();

  const push = (dir: string): void => {
    if (dir.length === 0 || seen.has(dir)) {
      return;
    }
    seen.add(dir);
    dirs.push(dir);
  };

  if (isNativeWindows(platform)) {
    // Official Windows layout: %APPDATA%\devin\cli\...
    const appData = envPath('APPDATA', env) ?? join(resolveUserHome(env), 'AppData', 'Roaming');
    push(join(appData, 'devin', 'cli'));
    // Some installers may still use LOCALAPPDATA; include as secondary.
    const localAppData =
      envPath('LOCALAPPDATA', env) ?? join(resolveUserHome(env), 'AppData', 'Local');
    push(join(localAppData, 'devin', 'cli'));
  }

  // XDG (Linux, some container setups, and Windows if the user exported it).
  const xdg = envPath('XDG_DATA_HOME', env);
  if (xdg !== null) {
    push(join(xdg, 'devin', 'cli'));
  }

  // Default Unix / WSL / macOS layout (also a harmless miss on native Windows).
  push(join(resolveUserHome(env), '.local', 'share', 'devin', 'cli'));

  return dirs;
};

/**
 * Absolute candidate paths for Devin's `sessions.db`.
 *
 * @param env - Env map.
 * @param platform - Platform for Windows vs Unix layout.
 * @returns Ordered DB paths.
 * @example
 * resolveDevinSessionsDbPaths()[0].endsWith('sessions.db'); // true
 */
export const resolveDevinSessionsDbPaths = (
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] => resolveDevinCliDataDirs(env, platform).map((dir) => join(dir, 'sessions.db'));

/**
 * Absolute candidate directories for Devin transcript JSON exports.
 *
 * @param env - Env map.
 * @param platform - Platform for Windows vs Unix layout.
 * @returns Ordered transcript directory paths.
 * @example
 * resolveDevinTranscriptDirs()[0].endsWith('transcripts'); // true
 */
export const resolveDevinTranscriptDirs = (
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] => resolveDevinCliDataDirs(env, platform).map((dir) => join(dir, 'transcripts'));

/**
 * Convenience roots used by list + transcript loaders.
 *
 * @param env - Env map.
 * @returns Absolute paths for each agent's primary store roots.
 * @example
 * const roots = resolveAgentStoreRoots();
 * roots.claudeProjects.endsWith('projects'); // true
 */
export const resolveAgentStoreRoots = (
  env: NodeJS.ProcessEnv = process.env,
): {
  readonly claudeProjects: string;
  readonly codexHome: string;
  readonly codexSessions: string;
  readonly codexSessionIndex: string;
  readonly cursorProjects: string;
  readonly grokSessions: string;
  readonly kimiHome: string;
  readonly kimiSessionIndex: string;
  readonly kiroSessionsCli: string;
  readonly devinSessionsDbs: readonly string[];
  readonly devinTranscriptDirs: readonly string[];
} => {
  const claudeHome = resolveClaudeHome(env);
  const codexHome = resolveCodexHome(env);
  const cursorHome = resolveCursorHome(env);
  const grokHome = resolveGrokHome(env);
  const kimiHome = resolveKimiHome(env);
  const kiroHome = resolveKiroHome(env);

  return {
    claudeProjects: join(claudeHome, 'projects'),
    codexHome,
    codexSessions: join(codexHome, 'sessions'),
    codexSessionIndex: join(codexHome, 'session_index.jsonl'),
    cursorProjects: join(cursorHome, 'projects'),
    grokSessions: join(grokHome, 'sessions'),
    kimiHome,
    kimiSessionIndex: join(kimiHome, 'session_index.jsonl'),
    kiroSessionsCli: join(kiroHome, 'sessions', 'cli'),
    devinSessionsDbs: resolveDevinSessionsDbPaths(env),
    devinTranscriptDirs: resolveDevinTranscriptDirs(env),
  };
};
