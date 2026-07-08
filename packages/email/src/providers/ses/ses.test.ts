// biome-ignore-all lint/style/noExcessiveClassesPerFile: SES command/client mocks intentionally use tiny fake classes.
import { it } from '@effect/vitest';
import { createSesEmail } from '@vybekiit/email/providers/ses';
import { Effect } from 'effect';
import { beforeEach, describe, expect, vi } from 'vitest';

const { send, command } = vi.hoisted(() => ({
  send: vi.fn(),
  command: {
    SendEmailCommand: class {
      readonly input: Record<string, unknown>;

      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    },
  },
}));

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: class {
    send = send;
  },
  ...command,
}));

/**
 * Return the command input sent to the mocked SES client.
 *
 * @returns Captured SES command input.
 * @example
 * expect(sentInput()).toMatchObject({ FromEmailAddress: 'hello@example.com' });
 */
const sentInput = (): Record<string, unknown> => {
  const [call] = send.mock.calls;
  if (call === undefined) {
    throw new Error('Expected SES send to be called.');
  }
  const [commandInput] = call;
  if (commandInput === undefined) {
    throw new Error('Expected SES command input.');
  }
  return commandInput.input;
};

const config = { AWS_REGION: 'us-east-1' };

const params = {
  to: 'buyer@example.com',
  from: 'hello@example.com',
  subject: 'Welcome',
  html: '<p>Hi</p>',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createSesEmail.send', () => {
  it('reports its provider name', () => {
    expect(createSesEmail(config).name).toBe('ses');
  });

  it.effect('issues a SendEmailCommand with the normalized fields and maps MessageId to id', () =>
    Effect.gen(function* () {
      send.mockResolvedValue({ MessageId: 'ses_msg_1' });

      const result = yield* createSesEmail(config).send(params);

      expect(result.id).toBe('ses_msg_1');
      expect(sentInput()).toEqual({
        FromEmailAddress: 'hello@example.com',
        Destination: { ToAddresses: ['buyer@example.com'] },
        Content: {
          Simple: {
            Subject: { Data: 'Welcome' },
            Body: { Html: { Data: '<p>Hi</p>' } },
          },
        },
      });
    }),
  );

  it.effect('includes the plain-text body when provided', () =>
    Effect.gen(function* () {
      send.mockResolvedValue({ MessageId: 'ses_msg_2' });

      yield* createSesEmail(config).send({ ...params, text: 'Hi' });

      const content = sentInput().Content as { readonly Simple: { readonly Body: unknown } };
      expect(content.Simple.Body).toEqual({
        Html: { Data: '<p>Hi</p>' },
        Text: { Data: 'Hi' },
      });
    }),
  );

  it.effect('maps an SDK error to EMAIL_SEND_FAILED', () =>
    Effect.gen(function* () {
      send.mockRejectedValue(new Error('email address is not verified'));

      const error = yield* Effect.flip(createSesEmail(config).send(params));

      expect(error.code).toBe('EMAIL_SEND_FAILED');
      expect(error.message).toBe('email address is not verified');
    }),
  );

  it.effect('fails when SES returns no MessageId', () =>
    Effect.gen(function* () {
      send.mockResolvedValue({});

      const error = yield* Effect.flip(createSesEmail(config).send(params));

      expect(error.code).toBe('EMAIL_INVALID_RESPONSE');
    }),
  );
});
