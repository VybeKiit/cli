import type { CliFlags } from './flags';

export type CommandContext = {
  readonly args: string[];
  readonly flags: CliFlags;
};

export type CommandHandler = (ctx: CommandContext) => Promise<number>;

export type CommandDef = {
  readonly description: string;
  readonly run: CommandHandler;
};

export type DomainDef = {
  readonly aliases?: string[];
  readonly commands: Record<string, CommandDef>;
  readonly name: string;
};

/** Registry for automation CLI domains and their commands. */
export class CommandRegistry {
  private readonly domains = new Map<string, DomainDef>();
  private readonly aliasToDomain = new Map<string, string>();

  /**
   * Register a domain command group.
   *
   * @param domain - Domain definition including commands and aliases.
   * @returns Nothing; the registry is updated in place.
   * @example
   * registry.register({ name: 'ls', commands: {} });
   */
  register(domain: DomainDef): void {
    this.domains.set(domain.name, domain);

    if (domain.aliases !== undefined) {
      for (const alias of domain.aliases) {
        this.aliasToDomain.set(alias, domain.name);
      }
    }
  }

  /**
   * Resolve a domain by canonical name or alias.
   *
   * @param name - Domain name or alias from the CLI.
   * @returns The matching domain definition when registered.
   * @example
   * const domain = registry.resolveDomain('payments/ls');
   */
  resolveDomain(name: string): DomainDef | undefined {
    const alias = this.aliasToDomain.get(name);
    const key = alias === undefined ? name : alias;
    return this.domains.get(key);
  }

  /**
   * List registered domains in insertion order.
   *
   * @returns Registered domain definitions.
   * @example
   * const domains = registry.listDomains();
   */
  listDomains(): DomainDef[] {
    return [...this.domains.values()];
  }

  /**
   * Format command help for terminal output.
   *
   * @returns Help text for the registered domains and global flags.
   * @example
   * process.stdout.write(registry.formatHelp());
   */
  formatHelp(): string {
    const lines = ['vybekiit-automate - dashboard automation\n', 'Domains:'];
    for (const domain of this.listDomains()) {
      const aliases =
        domain.aliases !== undefined && domain.aliases.length > 0
          ? ` (aliases: ${domain.aliases.join(', ')})`
          : '';
      lines.push(`  ${domain.name}${aliases}`);
      for (const [cmd, def] of Object.entries(domain.commands)) {
        lines.push(`    ${cmd.padEnd(22)} ${def.description}`);
      }
    }
    lines.push('\nGlobal flags: --json, --yes, --cdp=<url>, --profile=<path|last>');
    lines.push(
      '  Profile: defaults per domain (~/.nc-chrome-profile, etc.). --profile=last reuses last path from ~/.vybekiit/automate-profiles.json',
    );
    return lines.join('\n');
  }
}

/**
 * Create an empty command registry.
 *
 * @returns A new CommandRegistry instance.
 * @example
 * const registry = createRegistry();
 */
export const createRegistry = (): CommandRegistry => new CommandRegistry();
