import { describe, expect, it } from 'vitest';
import { GodaddyError } from '../src/registrar/godaddy';

describe('GodaddyError', () => {
  it('sets name and fields', () => {
    const error = new GodaddyError('fail', 401, '{"message":"Unauthorized"}');
    expect(error.name).toBe('GodaddyError');
    expect(error.statusCode).toBe(401);
    expect(error.responseBody).toContain('Unauthorized');
  });
});
