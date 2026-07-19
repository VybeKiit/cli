import { describe, expect, it } from 'vitest';
import { CLI_HELP_ALL } from './cliHelp';
import { COMMAND_NAMES } from './cliRunner';

/**
 * Verbs deliberately absent from `vybekiit help --all`.
 *
 * `update-kit` is the legacy/internal kit updater; the buyer-facing path is `update`
 * (the auto-updater). Keep this set tiny and each entry justified — it is the explicit
 * escape hatch for hidden verbs, not a place to silence the drift guard.
 */
const INTENTIONALLY_UNLISTED = new Set<string>(['update-kit']);

/** True when the verb appears as a whole word anywhere in the help text. */
const isDocumented = (verb: string): boolean => new RegExp(`\\b${verb}\\b`).test(CLI_HELP_ALL);

describe('CLI_HELP_ALL is the enforced test surface for the verb registry', () => {
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
});
