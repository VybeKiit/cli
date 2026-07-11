import { Data, Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { runEffectHttp } from './runEffectHttp';

class DemoError extends Data.TaggedError('DemoError')<{
  readonly code: string;
  readonly message: string;
}> {}

describe('runEffectHttp', () => {
  it('maps success through onSuccess', async () => {
    const response = await runEffectHttp({
      program: Effect.succeed({ id: '1' }),
      onSuccess: (value) => ({ status: 200 as const, body: value }),
      failurePolicy: { defaultOutcome: 'bad_input' },
    });
    expect(response).toEqual({ status: 200, body: { id: '1' } });
  });

  it('maps tagged failures with the default outcome', async () => {
    const onRejection = vi.fn();
    const response = await runEffectHttp({
      program: Effect.fail(new DemoError({ code: 'nope', message: 'Bad credentials.' })),
      onSuccess: (value) => ({ status: 200 as const, body: value }),
      failurePolicy: { defaultOutcome: 'unauthorized' },
      onRejection,
    });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: 'Bad credentials.' });
    expect(onRejection).toHaveBeenCalledOnce();
  });

  it('treats defectCodes as 500', async () => {
    const response = await runEffectHttp({
      program: Effect.fail(
        new DemoError({ code: 'auth_config_invalid', message: 'Missing secret.' }),
      ),
      onSuccess: (value) => ({ status: 200 as const, body: value }),
      failurePolicy: {
        defaultOutcome: 'unauthorized',
        defectCodes: new Set(['auth_config_invalid']),
      },
    });
    expect(response.status).toBe(500);
  });
});
