import { parseNamecheapDomain } from '@vybekiit/deploy/registrar/namecheap';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

// "Invalid domain for Namecheap API: invalid" -> match
const INVALID_DOMAIN_PATTERN = /Invalid domain/;

describe('parseNamecheapDomain', () => {
  it('splits sld and tld', async () => {
    await expect(Effect.runPromise(parseNamecheapDomain('vybekiit.com'))).resolves.toEqual({
      sld: 'vybekiit',
      tld: 'com',
    });
  });

  it('rejects invalid domains', async () => {
    const error = await Effect.runPromise(Effect.flip(parseNamecheapDomain('invalid')));

    expect(error.message).toMatch(INVALID_DOMAIN_PATTERN);
  });
});
