import process from 'node:process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLI_HELP_ALL } from './cliHelp';
import { COMMAND_NAMES, cliCommands, runCli } from './cliRunner';

/**
 * Verbs deliberately absent from `vybekiit help --all`.
 *
 * `update` remains a backward-compatible alias for old installers, while `update-kit` is
 * the legacy/internal kit updater. The buyer-facing rerun is always `vybekiit setup`.
 * Keep this set tiny and each entry justified — it is the explicit escape hatch for hidden
 * verbs, not a place to silence the drift guard.
 */
const INTENTIONALLY_UNLISTED = new Set<string>(['update', 'update-kit']);

/** True when the verb appears as a whole word anywhere in the help text. */
const isDocumented = (verb: string): boolean => new RegExp(`\\b${verb}\\b`).test(CLI_HELP_ALL);

describe('CLI_HELP_ALL is the enforced test surface for the verb registry', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(['--help', '-h'])('shows setup help without running setup for %s', async (helpFlag) => {
    const setupCommand = vi.spyOn(cliCommands, 'setup').mockResolvedValue(0);
    const printedHelp = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    expect(await runCli(['setup', helpFlag])).toBe(0);
    expect(setupCommand).not.toHaveBeenCalled();
    expect(printedHelp).toHaveBeenCalledWith(expect.stringContaining('vybekiit setup'));
  });
  it('documents every dispatchable verb (or explicitly whitelists it as hidden)', () => {
    const undocumented = COMMAND_NAMES.filter(
      (verb) => !(INTENTIONALLY_UNLISTED.has(verb) || isDocumented(verb)),
    );
    expect(undocumented).toEqual([]);
  });

  it('keeps the hidden-verb whitelist free of stale entries', () => {
    for (const hidden of INTENTIONALLY_UNLISTED) {
      expect(COMMAND_NAMES).toContain(hidden);
    }
  });

  it('keeps setup as the one buyer-facing rerun command', () => {
    expect(CLI_HELP_ALL).toContain('vybekiit setup');
    expect(CLI_HELP_ALL).not.toContain('vybekiit update');
  });
});
