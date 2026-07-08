import { it } from '@effect/vitest';
import { Effect, Schema } from 'effect';
import { describe, expect } from 'vitest';
import { appConfigSchema, parseEnv } from './config';

// "Invalid VybeKiit configuration: ..." -> match
const INVALID_CONFIG_PATTERN = /Invalid VybeKiit configuration/;

describe('parseEnv — Effect Schema slices (ADR-0023)', () => {
  const ExampleSchema = Schema.Struct({ APP_URL: Schema.String });

  it('decodes a valid Effect Schema slice, ignoring excess env keys', () => {
    const cfg = parseEnv(ExampleSchema, { APP_URL: 'https://vybekiit.test', PATH: '/usr/bin' });
    expect(cfg.APP_URL).toBe('https://vybekiit.test');
  });

  it('throws a fail-loud VybeKiit message when an Effect Schema slice is invalid', () => {
    expect(() => parseEnv(ExampleSchema, {})).toThrow(INVALID_CONFIG_PATTERN);
  });

  it('decodes a core config slice, applying its defaults', () => {
    const cfg = parseEnv(appConfigSchema, {});
    expect(cfg.NODE_ENV).toBe('development');
  });

  it.effect('runs an Effect through @effect/vitest (toolchain proof)', () =>
    Effect.gen(function* () {
      const doubled = yield* Effect.succeed(21).pipe(Effect.map((n) => n * 2));
      expect(doubled).toBe(42);
    }),
  );
});
