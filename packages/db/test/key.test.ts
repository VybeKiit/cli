import { describe, expect, it } from 'vitest';
import { selectDbKey } from '../src/key';

const base = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon' };

describe('selectDbKey', () => {
  it('prefers the service-role key when present', () => {
    expect(selectDbKey({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'service' })).toEqual({
      key: 'service',
      role: 'service',
    });
  });

  it('falls back to the anon key', () => {
    expect(selectDbKey(base)).toEqual({ key: 'anon', role: 'anon' });
  });
});
