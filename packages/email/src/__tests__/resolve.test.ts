// biome-ignore-all lint/style/noExcessiveClassesPerFile: SES command/client mocks intentionally use tiny fake classes.
import { it } from '@effect/vitest';
import { makeEmailLive, resolveEmailProvider, sendEmail } from '@vybekiit/email/resolve';
import { Effect } from 'effect';
import { describe, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: class {
    send = vi.fn();
  },
  SendEmailCommand: class {
    readonly input: Record<string, unknown>;

    constructor(input: Record<string, unknown>) {
      this.input = input;
    }
  },
}));

const cloudflareEnv = {
  EMAIL_WORKER_SECRET: 'worker-secret',
  CLOUDFLARE_EMAIL_ENDPOINT: 'https://app.example.com/send',
};

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Email resolver contract cases stay grouped for auditability.
describe('resolveEmailProvider', () => {
  it.effect('defaults to the cloudflare adapter from Schema config', () =>
    Effect.gen(function* () {
      const provider = yield* resolveEmailProvider(cloudflareEnv);
      expect(provider.name).toBe('cloudflare');
    }),
  );

  it.effect('fails loud when cloudflare email creds are missing', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveEmailProvider({}));
      expect(error.code).toBe('EMAIL_CONFIG_INVALID');
      expect(error.message).toContain('EMAIL_WORKER_SECRET');
    }),
  );

  it.effect('constructs the ses adapter from its email-owned config', () =>
    Effect.gen(function* () {
      const provider = yield* resolveEmailProvider({
        EMAIL_PROVIDER: 'ses',
        AWS_REGION: 'us-east-1',
      });
      expect(provider.name).toBe('ses');
    }),
  );

  it.effect('fails loud when the ses adapter is selected without its region', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveEmailProvider({ EMAIL_PROVIDER: 'ses' }));
      expect(error.code).toBe('EMAIL_CONFIG_INVALID');
      expect(error.message).toContain('AWS_REGION');
    }),
  );

  it.effect('constructs the resend adapter from its API key', () =>
    Effect.gen(function* () {
      const provider = yield* resolveEmailProvider({
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test',
      });
      expect(provider.name).toBe('resend');
    }),
  );

  it.effect('sends through the configured Email Layer', () =>
    Effect.gen(function* () {
      const fetchImpl = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 'layer_msg_1' }),
        }),
      );
      const sent = yield* sendEmail({
        to: 'buyer@example.com',
        from: 'hello@example.com',
        subject: 'Welcome',
        html: '<p>Hi</p>',
      }).pipe(Effect.provide(makeEmailLive(cloudflareEnv, fetchImpl)));

      expect(sent.id).toBe('layer_msg_1');
    }),
  );
});
