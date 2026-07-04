import { GodaddyError } from '@vybekiit/deploy/registrar/godaddy';
import { describe, expect, it } from 'vitest';

describe('GodaddyError', () => {
  it('sets name and fields', () => {
    const error = new GodaddyError('fail', 401, '{"message":"Unauthorized"}');
    expect(error.name).toBe('GodaddyError');
    expect(error.statusCode).toBe(401);
    expect(error.responseBody).toContain('Unauthorized');
  });
});
