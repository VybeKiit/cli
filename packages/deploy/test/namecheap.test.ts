import { parseNamecheapDomain } from '@vybekiit/deploy/registrar/namecheap';
import { describe, expect, it } from 'vitest';

describe('parseNamecheapDomain', () => {
  it('splits sld and tld', () => {
    expect(parseNamecheapDomain('vybekiit.com')).toEqual({ sld: 'vybekiit', tld: 'com' });
  });

  it('rejects invalid domains', () => {
    expect(() => parseNamecheapDomain('invalid')).toThrow(/Invalid domain/);
  });
});
