#!/usr/bin/env node

/**
 * vybekiit-automate — unified dashboard automation CLI (registry dispatch).
 */

import { buildAutomationRegistry } from './buildRegistry';
import { listAutomationCatalog } from './catalog';
import { parseGlobalFlags } from './flags';
import { printError, printJson, printLine } from './output';

const registry = buildAutomationRegistry();

/**
 * Dispatch a catalog list request for agents / MCP.
 *
 * @param flagsJson - Whether the caller requested JSON output.
 * @returns Process exit code.
 * @example
 * handleCatalogCommand(true);
 */
const handleCatalogCommand = (flagsJson: boolean): number => {
  const catalog = listAutomationCatalog(registry);
  if (flagsJson) {
    printJson({ ok: true, total: catalog.length, items: catalog });
  } else {
    printLine(registry.formatHelp());
  }
  return 0;
};

/**
 * Run the automation CLI against argv (without the binary name).
 *
 * @param argv - CLI arguments after `vybekiit-automate`.
 * @returns Process exit code.
 * @example
 * await main(['ls', 'setup', '--json']);
 */
export const main = async (argv: string[]): Promise<number> => {
  const { flags, rest } = parseGlobalFlags(argv);

  if (rest.length === 0 || rest[0] === '--help' || rest[0] === '-h') {
    printLine(registry.formatHelp());
    return 0;
  }

  if (rest[0] === 'catalog' || rest[0] === 'list') {
    return handleCatalogCommand(flags.json || rest.includes('--json'));
  }

  const [domainName, commandName, ...commandArgs] = rest;
  if (!(domainName && commandName)) {
    printError('Usage: vybekiit-automate <domain> <command> [args]', flags.json);
    return 1;
  }

  if (domainName === 'payments' && commandArgs[0]) {
    const payDomain = registry.resolveDomain(`payments/${commandName}`);
    if (payDomain) {
      const subCommand = commandArgs[0];
      const subArgs = commandArgs.slice(1);
      const def = payDomain.commands[subCommand];
      if (!def) {
        printError(
          `Unknown command "${subCommand}" for domain payments/${commandName}`,
          flags.json,
        );
        return 1;
      }
      try {
        return await def.run({ flags, args: subArgs });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        printError(message, flags.json);
        return 1;
      }
    }
  }

  const domain = registry.resolveDomain(domainName);
  if (!domain) {
    printError(`Unknown domain "${domainName}".`, flags.json);
    return 1;
  }

  const def = domain.commands[commandName];
  if (!def) {
    printError(`Unknown command "${commandName}" for domain ${domain.name}.`, flags.json);
    return 1;
  }

  try {
    return await def.run({ flags, args: commandArgs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(message, flags.json);
    return 1;
  }
};

/**
 * CLI entry: run main and exit with its code.
 *
 * @returns Never returns after process.exit.
 * @example
 * void runCli();
 */
const runCli = async (): Promise<void> => {
  const code = await main(process.argv.slice(2));
  process.exit(code);
};

void runCli();
