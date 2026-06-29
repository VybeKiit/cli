#!/usr/bin/env node
/**
 * vybekiit-automate — unified dashboard automation CLI (registry dispatch).
 */

import { createRegistry } from './registry';
import { parseGlobalFlags } from './flags';
import { printError } from './output';
import { registerExtensionDomain } from '../domains/extension/cli';
import { registerLsDomain, registerLsTopLevelAlias } from '../domains/payments/ls/cli';

const registry = createRegistry();
registerExtensionDomain(registry);
registerLsDomain(registry);
registerLsTopLevelAlias(registry);

async function main(argv: string[]): Promise<number> {
  const { flags, rest } = parseGlobalFlags(argv);

  if (rest.length === 0 || rest[0] === '--help' || rest[0] === '-h') {
    console.log(registry.formatHelp());
    return 0;
  }

  const [domainName, commandName, ...commandArgs] = rest;
  if (!domainName || !commandName) {
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
        printError(`Unknown command "${subCommand}" for domain payments/${commandName}`, flags.json);
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
}

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
