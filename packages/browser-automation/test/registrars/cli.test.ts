import { describe, expect, it } from 'vitest';

import { createRegistry } from '../../src/cli/registry';
import {
  registerGodaddyDomain,
  registerGdTopLevelAlias,
} from '../../src/domains/registrars/godaddy/cli';
import {
  registerNamecheapDomain,
  registerNcTopLevelAlias,
} from '../../src/domains/registrars/namecheap/cli';

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
