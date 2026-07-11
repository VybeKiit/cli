import {
  registerAnthropicDomain,
  registerOpenAiDomain,
} from '@vybekiit/browser-automation/domains/ai/cli';
import { registerSupabaseDomain } from '@vybekiit/browser-automation/domains/dbs/cli';
import {
  registerNeonDomain,
  registerUpstashDomain,
} from '@vybekiit/browser-automation/domains/dbs/neonUpstash';
import { registerExtensionDomain } from '@vybekiit/browser-automation/domains/extension/cli';
import { registerGoogleDomain } from '@vybekiit/browser-automation/domains/google/cli';
import { registerCfDomain } from '@vybekiit/browser-automation/domains/infra/cli';
import {
  registerRailwayDomain,
  registerVercelDomain,
} from '@vybekiit/browser-automation/domains/infra/cliAuthProvider';
import {
  registerGithubDomain,
  registerResendDomain,
  registerSentryDomain,
} from '@vybekiit/browser-automation/domains/misc/cli';
import {
  registerLsDomain,
  registerLsTopLevelAlias,
} from '@vybekiit/browser-automation/domains/payments/ls/cli';
import {
  registerGdTopLevelAlias,
  registerGodaddyDomain,
} from '@vybekiit/browser-automation/domains/registrars/godaddy/cli';
import {
  registerNamecheapDomain,
  registerNcTopLevelAlias,
} from '@vybekiit/browser-automation/domains/registrars/namecheap/cli';
import { type CommandRegistry, createRegistry } from './registry';

/**
 * Build the full `vybekiit-automate` domain registry (SSOT for CLI + catalog).
 *
 * @returns Registry with every automation domain registered.
 * @example
 * const registry = buildAutomationRegistry();
 * registry.formatHelp();
 */
export const buildAutomationRegistry = (): CommandRegistry => {
  const registry = createRegistry();
  registerExtensionDomain(registry);
  registerLsDomain(registry);
  registerLsTopLevelAlias(registry);
  registerNamecheapDomain(registry);
  registerNcTopLevelAlias(registry);
  registerGodaddyDomain(registry);
  registerGdTopLevelAlias(registry);
  registerGoogleDomain(registry);
  registerSupabaseDomain(registry);
  registerCfDomain(registry);
  registerRailwayDomain(registry);
  registerVercelDomain(registry);
  registerNeonDomain(registry);
  registerUpstashDomain(registry);
  registerOpenAiDomain(registry);
  registerAnthropicDomain(registry);
  registerGithubDomain(registry);
  registerResendDomain(registry);
  registerSentryDomain(registry);
  return registry;
};
