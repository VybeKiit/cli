import { describe, expect, it } from 'vitest';

import { createRegistry } from '../../src/cli/registry';
import { registerExtensionDomain } from '../../src/domains/extension/cli';
import { registerLsDomain, registerLsTopLevelAlias } from '../../src/domains/payments/ls/cli';
import {
  registerNamecheapDomain,
  registerNcTopLevelAlias,
} from '../../src/domains/registrars/namecheap/cli';

describe('CommandRegistry', () => {
  it('registers extension domain with cws alias', () => {
    const registry = createRegistry();
    registerExtensionDomain(registry);
    expect(registry.resolveDomain('extension')?.commands.import).toBeDefined();
    expect(registry.resolveDomain('cws')?.name).toBe('extension');
  });

  it('registers ls top-level alias', () => {
    const registry = createRegistry();
    registerLsDomain(registry);
    registerLsTopLevelAlias(registry);
    expect(registry.resolveDomain('ls')?.commands.standby).toBeDefined();
    expect(registry.resolveDomain('payments/ls')?.commands.setup).toBeDefined();
  });

  it('registers nc top-level alias', () => {
    const registry = createRegistry();
    registerNamecheapDomain(registry);
    registerNcTopLevelAlias(registry);
    expect(registry.resolveDomain('nc')?.commands.setup).toBeDefined();
  });

  it('formatHelp lists domains', () => {
    const registry = createRegistry();
    registerExtensionDomain(registry);
    const help = registry.formatHelp();
    expect(help).toContain('extension');
    expect(help).toContain('import');
  });
});
