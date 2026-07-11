import { Data, Effect, Exit, Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { lookupProviderFactory, resolveProviderEffect } from './resolveProviderEffect';

class TestError extends Data.TaggedError('TestError')<{
  readonly code: 'CONFIG_INVALID' | 'PROVIDER_UNSUPPORTED';
  readonly message: string;
}> {}

const ConfigSchema = Schema.Struct({
  DEMO_PROVIDER: Schema.Literal('alpha', 'beta'),
});

type DemoProvider = { readonly name: 'alpha' | 'beta' };

const demoFactories = {
  alpha: (): DemoProvider => ({ name: 'alpha' }),
  beta: (): DemoProvider => ({ name: 'beta' }),
} as const;

describe('resolveProviderEffect', () => {
  it('constructs the registered adapter for the selected provider', async () => {
    const exit = await Effect.runPromiseExit(
      resolveProviderEffect({
        source: { DEMO_PROVIDER: 'beta' },
        configSchema: ConfigSchema,
        providerKey: 'DEMO_PROVIDER',
        factories: demoFactories,
        toError: (input) => new TestError(input),
      }),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual({ name: 'beta' });
    }
  });

  it('fails with PROVIDER_UNSUPPORTED when the factory map has no row', async () => {
    const exit = await Effect.runPromiseExit(
      resolveProviderEffect({
        source: { DEMO_PROVIDER: 'beta' },
        configSchema: ConfigSchema,
        providerKey: 'DEMO_PROVIDER',
        factories: {
          alpha: demoFactories.alpha,
        },
        toError: (input) => new TestError(input),
      }),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const failure = Exit.causeOption(exit);
      expect(failure._tag).toBe('Some');
    }
  });
});

describe('lookupProviderFactory', () => {
  it('returns the constructed provider', async () => {
    const result = await Effect.runPromise(
      lookupProviderFactory(
        'alpha',
        { alpha: () => ({ ok: true }) },
        {},
        {},
        (input) => new TestError(input),
      ),
    );
    expect(result).toEqual({ ok: true });
  });
});
