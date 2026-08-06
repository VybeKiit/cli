import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * The set of absolute paths a global VybeKiit install reads and writes.
 *
 * `configDir` is the Claude Code user config directory. We honour `CLAUDE_CONFIG_DIR`
 * (the same override Claude Code itself uses) so the whole global install can be pointed
 * at a throwaway sandbox in tests — it must never touch a real ~/.claude by accident.
 */
export type GlobalPaths = {
  /** Claude Code user config dir (~/.claude, or $CLAUDE_CONFIG_DIR). */
  readonly configDir: string;
  /** Where global skills are copied (~/.claude/skills). */
  readonly skillsDir: string;
  /** Where the global `/vybekiit` slash command is written (~/.claude/commands). */
  readonly commandsDir: string;
  /** Global user memory Claude injects into every session (~/.claude/CLAUDE.md). */
  readonly memoryFile: string;
  /** Global user settings, home of the status-line badge (~/.claude/settings.json). */
  readonly settingsFile: string;
  /** The skills payload bundled into the published CLI (dist/global-skills). */
  readonly bundledSkillsDir: string;
};

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the Claude Code user config directory, honouring `CLAUDE_CONFIG_DIR`.
 *
 * @returns Absolute path to the config dir.
 * @example
 * const dir = claudeConfigDir(); // ~/.claude
 */
export const claudeConfigDir = (): string => {
  const override = process.env.CLAUDE_CONFIG_DIR;
  if (override !== undefined && override.trim() !== '') {
    return override.trim();
  }
  return join(homedir(), '.claude');
};

/**
 * Resolve all paths the global install touches.
 *
 * @param configDir - Config dir override (defaults to {@link claudeConfigDir}).
 * @returns The resolved {@link GlobalPaths}.
 * @example
 * const paths = globalInstallPaths();
 */
export const globalInstallPaths = (configDir: string = claudeConfigDir()): GlobalPaths => ({
  configDir,
  skillsDir: join(configDir, 'skills'),
  commandsDir: join(configDir, 'commands'),
  memoryFile: join(configDir, 'CLAUDE.md'),
  settingsFile: join(configDir, 'settings.json'),
  // At runtime this module is inlined into dist/bin.js, so MODULE_DIR is <install>/dist
  // and the payload sits beside it at dist/global-skills.
  bundledSkillsDir: join(MODULE_DIR, 'global-skills'),
});
