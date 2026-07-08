import { verifyGodaddyCredentials } from '@vybekiit/deploy/registrar/godaddy';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

describe('verifyGodaddyCredentials', () => {
  it('fails when credentials are missing', async () => {
    const error = await Effect.runPromise(Effect.flip(verifyGodaddyCredentials({})));

    expect(error.code).toBe('godaddy_config_missing');
  });
});
