import { buildAutomationRegistry } from './buildRegistry';
import type { CommandRegistry } from './registry';

export { buildAutomationRegistry } from './buildRegistry';

/** One discoverable automation verb for agents / MCP. */
export type AutomationCatalogEntry = {
  readonly id: string;
  readonly domain: string;
  readonly aliases: readonly string[];
  readonly command: string;
  readonly description: string;
  readonly usage: string;
};

/**
 * Flatten a command registry into catalog rows (no handlers).
 *
 * @param registry - Populated automation registry.
 * @returns Catalog entries in registration order.
 * @example
 * listAutomationCatalog(buildAutomationRegistry());
 */
export const listAutomationCatalog = (
  registry: CommandRegistry = buildAutomationRegistry(),
): readonly AutomationCatalogEntry[] => {
  const entries: AutomationCatalogEntry[] = [];

  for (const domain of registry.listDomains()) {
    const aliases = domain.aliases ?? [];
    for (const [command, def] of Object.entries(domain.commands)) {
      const id = `${domain.name}:${command}`;
      entries.push({
        id,
        domain: domain.name,
        aliases,
        command,
        description: def.description,
        usage: `vybekiit-automate ${domain.name} ${command} --json`,
      });
    }
  }

  return entries;
};

/**
 * Find one automation by domain + command or by id (`domain:command`).
 *
 * @param domainOrId - Domain name/alias, or full `domain:command` id.
 * @param command - Command name when domainOrId is only a domain.
 * @param registry - Optional registry override (tests).
 * @returns Matching catalog entry, or undefined.
 * @example
 * getAutomation('ls', 'setup');
 * getAutomation('payments/ls:setup');
 */
export const getAutomation = (
  domainOrId: string,
  command?: string,
  registry: CommandRegistry = buildAutomationRegistry(),
): AutomationCatalogEntry | undefined => {
  const catalog = listAutomationCatalog(registry);

  if (command === undefined) {
    const byId = catalog.find((entry) => entry.id === domainOrId);
    if (byId !== undefined) {
      return byId;
    }
    // Allow "ls setup" style as single string "ls:setup" already handled; try last colon split.
    const colon = domainOrId.indexOf(':');
    if (colon > 0) {
      return getAutomation(domainOrId.slice(0, colon), domainOrId.slice(colon + 1), registry);
    }
    return;
  }

  const domain = registry.resolveDomain(domainOrId);
  if (domain === undefined) {
    return;
  }
  return catalog.find((entry) => entry.domain === domain.name && entry.command === command);
};
