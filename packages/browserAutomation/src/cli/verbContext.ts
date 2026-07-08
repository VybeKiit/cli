import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';
import type { CliFlags } from './flags';

/**
 * Map global CLI flags to verb context shared by all domains.
 *
 * @param flags - Parsed global CLI flags.
 * @returns Base automation context for domain commands.
 * @example
 * const ctx = baseVerbContext({ json: false, yes: true, cdp: 'http://localhost:9222' });
 */
export const baseVerbContext = (flags: CliFlags): BaseVerbContext => ({
  ...(flags.cdp ? { cdpEndpoint: flags.cdp } : {}),
  ...(flags.profile ? { profilePath: flags.profile } : {}),
});
