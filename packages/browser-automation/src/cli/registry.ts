import type { CliFlags } from './flags';

export type CommandContext = {
  args: string[];
  flags: CliFlags;
};

export type CommandHandler = (ctx: CommandContext) => Promise<number>;

export type CommandDef = {
  description: string;
  run: CommandHandler;
};

export type DomainDef = {
  aliases?: string[];
  commands: Record<string, CommandDef>;
  name: string;
};

export class CommandRegistry {
  private domains = new Map<string, DomainDef>();
  private aliasToDomain = new Map<string, string>();

  register(domain: DomainDef): void {
    this.domains.set(domain.name, domain);
    for (const alias of domain.aliases ?? []) {
      this.aliasToDomain.set(alias, domain.name);
    }
  }

  resolveDomain(name: string): DomainDef | undefined {
    const key = this.aliasToDomain.get(name) ?? name;
    return this.domains.get(key);
  }

  listDomains(): DomainDef[] {
    return [...this.domains.values()];
  }

  formatHelp(): string {
    const lines = ['vybekiit-automate — dashboard automation\n', 'Domains:'];
    for (const domain of this.listDomains()) {
      const aliases = domain.aliases?.length ? ` (aliases: ${domain.aliases.join(', ')})` : '';
      lines.push(`  ${domain.name}${aliases}`);
      for (const [cmd, def] of Object.entries(domain.commands)) {
        lines.push(`    ${cmd.padEnd(22)} ${def.description}`);
      }
    }
    lines.push('\nGlobal flags: --json, --yes, --profile=<path>');
    return lines.join('\n');
  }
}

export function createRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  return registry;
}
