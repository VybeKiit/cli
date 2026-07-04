import type { BaseVerbContext } from '@vybekiit/browserAutomation/core/types';
import type { CliFlags } from './flags';

/** Map global CLI flags to verb context shared by all domains. */
export function baseVerbContext(flags: CliFlags): BaseVerbContext {
  const ctx: BaseVerbContext = {};
  if (flags.cdp) ctx.cdpEndpoint = flags.cdp;
  if (flags.profile) ctx.profilePath = flags.profile;
  return ctx;
}
