import { describe, expect, it } from 'vitest';
import { parseNamecheapDomain } from '../src/registrar/namecheap';

describe('parseNamecheapDomain', () => {
  it('splits sld and tld', () => {
    expect(parseNamecheapDomain('vybekiit.com')).toEqual({ sld: 'vybekiit', tld: 'com' });
  });

  it('rejects invalid domains', () => {
    expect(() => parseNamecheapDomain('invalid')).toThrow(/Invalid domain/);
  });
});
