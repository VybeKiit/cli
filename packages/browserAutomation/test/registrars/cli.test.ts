import { createRegistry } from '@vybekiit/browserAutomation/cli/registry';
import {
  registerGdTopLevelAlias,
  registerGodaddyDomain,
} from '@vybekiit/browserAutomation/domains/registrars/godaddy/cli';
import {
  registerNamecheapDomain,
  registerNcTopLevelAlias,
} from '@vybekiit/browserAutomation/domains/registrars/namecheap/cli';
import { describe, expect, it } from 'vitest';

describe('registrar CLI registry', () => {
  it('registers nc and gd aliases', () => {
    const registry = createRegistry();
    registerNamecheapDomain(registry);
    registerNcTopLevelAlias(registry);
    registerGodaddyDomain(registry);
    registerGdTopLevelAlias(registry);

    expect(registry.resolveDomain('nc')?.commands.setup).toBeDefined();
    expect(registry.resolveDomain('gd')?.commands.standby).toBeDefined();
    expect(registry.resolveDomain('registrars/namecheap')?.commands.setup).toBeDefined();
    expect(registry.resolveDomain('registrars/godaddy')?.commands.setup).toBeDefined();
  });
});
