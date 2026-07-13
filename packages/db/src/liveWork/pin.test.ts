import { describe, expect, it } from 'vitest';
import { buildDataPinKeys, buyerDataSuccessMessage, companionAuthForData, dataBrand } from './pin';

// "DATA_PROVIDER|DATABASE_URL|API" -> match jargon leak
const ENV_JARGON_PATTERN = /DATA_PROVIDER|DATABASE_URL|API/i;
// "env|API|quota_exceeded" -> match jargon leak
const HOP_JARGON_PATTERN = /env|API|quota_exceeded/i;

describe('companionAuthForData', () => {
  it('maps supabase → supabase and neon/railway → better-auth', () => {
    expect(companionAuthForData('supabase')).toBe('supabase');
    expect(companionAuthForData('neon')).toBe('better-auth');
    expect(companionAuthForData('railway')).toBe('better-auth');
  });
});

describe('buildDataPinKeys', () => {
  it('pins DATA_PROVIDER, auth companion, and connection secrets', () => {
    expect(
      buildDataPinKeys({
        provider: 'neon',
        databaseUrl: 'postgresql://u:p@h/db',
        claimUrl: 'https://neon.new/claim/x',
        claimableId: 'id-1',
        ephemeral: true,
      }),
    ).toEqual({
      DATA_PROVIDER: 'neon',
      AUTH_PROVIDER: 'better-auth',
      DATABASE_URL: 'postgresql://u:p@h/db',
      PUBLIC_POSTGRES_CLAIM_URL: 'https://neon.new/claim/x',
      CLAIMABLE_POSTGRES_ID: 'id-1',
    });
  });

  it('pins AUTH_PROVIDER=supabase for supabase data', () => {
    expect(buildDataPinKeys({ provider: 'supabase', ephemeral: false })).toEqual({
      DATA_PROVIDER: 'supabase',
      AUTH_PROVIDER: 'supabase',
    });
  });

  it('does not overwrite an explicit AUTH_PROVIDER', () => {
    expect(
      buildDataPinKeys(
        { provider: 'neon', databaseUrl: 'postgresql://x', ephemeral: false },
        { existingAuthProvider: 'local' },
      ),
    ).toEqual({
      DATA_PROVIDER: 'neon',
      DATABASE_URL: 'postgresql://x',
    });
  });
});

describe('buyerDataSuccessMessage', () => {
  it('celebrates without jargon', () => {
    expect(buyerDataSuccessMessage('neon', false)).toContain('Neon');
    expect(buyerDataSuccessMessage('neon', false)).not.toMatch(ENV_JARGON_PATTERN);
  });

  it('explains a free-tier hop in plain language', () => {
    const message = buyerDataSuccessMessage('neon', true, 'supabase');
    expect(message).toContain('Supabase');
    expect(message).toContain('Neon');
    expect(message).not.toMatch(HOP_JARGON_PATTERN);
  });
});

describe('dataBrand', () => {
  it('maps ids to brands', () => {
    expect(dataBrand('supabase')).toBe('Supabase');
    expect(dataBrand('neon')).toBe('Neon');
    expect(dataBrand('railway')).toBe('Railway');
  });
});
