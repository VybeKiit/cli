import { createRegistry } from '@vybekiit/browser-automation/cli/registry';
import { registerExtensionDomain } from '@vybekiit/browser-automation/domains/extension/cli';
import {
  registerLsDomain,
  registerLsTopLevelAlias,
} from '@vybekiit/browser-automation/domains/payments/ls/cli';
import {
  registerNamecheapDomain,
  registerNcTopLevelAlias,
} from '@vybekiit/browser-automation/domains/registrars/namecheap/cli';
import { describe, expect, it } from 'vitest';

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
