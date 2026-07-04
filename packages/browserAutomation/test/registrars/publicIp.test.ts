import { fetchPublicIpv4 } from '@vybekiit/browserAutomation/domains/registrars/shared/publicIp';
import { describe, expect, it } from 'vitest';

describe('fetchPublicIpv4', () => {
  it('validates ipv4 shape from mocked response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ip: '203.0.113.44' }), { status: 200 });

    await expect(fetchPublicIpv4()).resolves.toBe('203.0.113.44');
    globalThis.fetch = originalFetch;
  });
});
