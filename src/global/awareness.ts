import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { GlobalPaths } from './globalPaths';

// Markers delimit the block we own inside the user's global CLAUDE.md. Everything outside
// them is the user's and is never touched; everything inside is regenerated on each run.
const BEGIN_MARKER = '<!-- BEGIN VYBEKIIT (managed by `vybekiit setup`) -->';
const END_MARKER = '<!-- END VYBEKIIT -->';
// Hoisted (biome useTopLevelRegex): strips a single leading newline left after the block.
const LEADING_NEWLINE = /^\n/;

/** Body of the global `/vybekiit` slash command (~/.claude/commands/vybekiit.md). */
const VYBEKIIT_COMMAND = `---
description: Show VybeKiit status and what you can do with it right now
---
VybeKiit is installed globally on this machine. Orient the user in plain, non-technical language.

Do this now, briefly:
1. Say: "✅ VybeKiit is active — you have its skills and browser automation in every project."
2. Use the global VybeKiit tools now: call search_skills for the user's goal, then get_skill for
   the best match. Use search_commands before suggesting a CLI command. For interface work, use
   search_ui_components or suggest_ui_blend before writing new UI.
3. If there is no app in the current folder yet, check for ~/vybekiit-app (first-install default).
   If it exists, offer to open that folder and run onboarding. Otherwise offer
   \`vybekiit create app --web\`. If they are already in an app folder, ask what they want next.
4. Mention Report mode once if they are in an app: Option+Shift+R (Alt+Shift+R on Windows).

Keep it short and friendly. Do not dump the whole skill list.
`;

/**
 * The managed CLAUDE.md block. Injected into the user's global memory so Claude is aware
 * of VybeKiit in every session and tells the user it is active.
 *
 * @returns The block text, markers included.
 * @example
 * const block = vybekiitMemoryBlock();
 */
export const vybekiitMemoryBlock = (): string =>
  [
    BEGIN_MARKER,
    '## VybeKiit is active on this machine',
    '',
    'VybeKiit is installed globally: its skills live in `~/.claude/skills`, and the `vybekiit` MCP server is registered globally alongside `playwright` and `context7`.',
    'The VybeKiit server provides skills, commands, browser automations, and UI catalog tools in every project. Key-gated',
    'servers like `sentry`, `github`, and `stripe` register once their API key is set (run',
    '`vybekiit env wizard`).',
    '',
    'At the start of a session, use `search_skills` for the user goal and `get_skill` for the chosen',
    'workflow. Use `search_commands` before proposing a VybeKiit command. For interface work, use',
    '`search_ui_components` or `suggest_ui_blend` before creating UI. For browser setup, search',
    'automations before running one. Briefly tell the user VybeKiit is available. The user can type',
    '`/vybekiit` any time to see status.',
    END_MARKER,
    '',
  ].join('\n');

/**
 * Upsert the managed block into existing global-memory content.
 *
 * @param existing - Current CLAUDE.md content ('' when the file is absent).
 * @param block - The block to insert or replace (from {@link vybekiitMemoryBlock}).
 * @returns The updated content, or the original when already current.
 * @example
 * const next = upsertMemoryBlock(previous, vybekiitMemoryBlock());
 */
export const upsertMemoryBlock = (existing: string, block: string): string => {
  const begin = existing.indexOf(BEGIN_MARKER);
  const end = existing.indexOf(END_MARKER);
  if (begin !== -1 && end !== -1 && end > begin) {
    const before = existing.slice(0, begin);
    const after = existing.slice(end + END_MARKER.length).replace(LEADING_NEWLINE, '');
    return `${before}${block}${after}`;
  }
  if (existing.trim() === '') {
    return block;
  }
  return `${existing.trimEnd()}\n\n${block}`;
};

/** What {@link installAwareness} changed. */
export type AwarenessResult = {
  readonly commandWritten: boolean;
  readonly memoryUpdated: boolean;
  readonly statusLineSet: boolean;
};

/**
 * Read a file, returning '' when it does not exist (and rethrowing other errors).
 *
 * @param path - File to read.
 * @returns File content or ''.
 */
const readOrEmpty = async (path: string): Promise<string> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

/**
 * Write the file only when the content actually changed.
 *
 * @param path - Target file.
 * @param next - Desired content.
 * @param previous - Content read earlier.
 * @returns True when a write happened.
 */
const writeIfChanged = async (path: string, next: string, previous: string): Promise<boolean> => {
  if (next === previous) {
    return false;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, next, 'utf8');
  return true;
};

/** Diamond badge shown on Claude Code's status line. */
export const STATUSLINE_BADGE = '◆ vybekiit';

/** Full command when the user has no status line yet. */
export const STATUSLINE_BADGE_COMMAND = `echo '${STATUSLINE_BADGE}'`;

/**
 * Shell snippet appended after an existing status-line command.
 * Runs after the user's script so stdin is still available to it first.
 */
export const STATUSLINE_APPEND_SNIPPET = `printf ' · ${STATUSLINE_BADGE}'`;

/**
 * Whether a statusLine.command already includes our badge (so reinstall stays idempotent).
 *
 * @param command - Existing statusLine.command string.
 * @returns True when the badge is already present.
 */
export const statusLineCommandHasBadge = (command: string): boolean =>
  command.includes(STATUSLINE_BADGE);

/**
 * Ensure Claude Code's status line shows the VybeKiit badge.
 *
 * - No status line → set `echo '◆ vybekiit'`.
 * - Existing command without the badge → append `printf ' · ◆ vybekiit'` (never replace).
 * - Already has the badge → leave unchanged.
 *
 * @param raw - Current settings.json content ('' when absent).
 * @returns The updated content, or null when it should be left as-is.
 * @example
 * const next = withStatusLineBadge('{}');
 */
export const withStatusLineBadge = (raw: string): string | null => {
  let settings: Record<string, unknown> = {};
  if (raw.trim() !== '') {
    try {
      settings = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // Malformed settings.json is the user's to fix — don't overwrite it.
      return null;
    }
  }

  const existing = settings.statusLine;
  if (existing === undefined) {
    settings.statusLine = { type: 'command', command: STATUSLINE_BADGE_COMMAND };
    return `${JSON.stringify(settings, null, 2)}\n`;
  }

  if (typeof existing !== 'object' || existing === null) {
    return null;
  }

  const statusLine = existing as { readonly type?: unknown; readonly command?: unknown };
  if (typeof statusLine.command !== 'string') {
    return null;
  }

  if (statusLineCommandHasBadge(statusLine.command)) {
    return null;
  }

  settings.statusLine = {
    type: typeof statusLine.type === 'string' ? statusLine.type : 'command',
    command: `${statusLine.command}; ${STATUSLINE_APPEND_SNIPPET}`,
  };
  return `${JSON.stringify(settings, null, 2)}\n`;
};

/**
 * Install every awareness signal: the `/vybekiit` command, the CLAUDE.md block, and the
 * status-line badge. Idempotent — safe to run on every setup.
 *
 * @param paths - Resolved global paths.
 * @returns Which signals changed.
 */
export const installAwareness = async (paths: GlobalPaths): Promise<AwarenessResult> => {
  const commandPath = `${paths.commandsDir}/vybekiit.md`;
  const commandWritten = await writeIfChanged(
    commandPath,
    VYBEKIIT_COMMAND,
    await readOrEmpty(commandPath),
  );

  const previousMemory = await readOrEmpty(paths.memoryFile);
  const memoryUpdated = await writeIfChanged(
    paths.memoryFile,
    upsertMemoryBlock(previousMemory, vybekiitMemoryBlock()),
    previousMemory,
  );

  const previousSettings = await readOrEmpty(paths.settingsFile);
  const nextSettings = withStatusLineBadge(previousSettings);
  const statusLineSet =
    nextSettings !== null &&
    (await writeIfChanged(paths.settingsFile, nextSettings, previousSettings));

  return { commandWritten, memoryUpdated, statusLineSet };
};
