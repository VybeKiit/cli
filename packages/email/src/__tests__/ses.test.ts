import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSesEmail } from '../providers/ses';

/**
 * `vi.mock` is hoisted above imports, so its factory's refs must be hoisted too. The
 * fake SendEmailCommand captures `input`, letting a test assert the exact SES payload,
 * while `send` is stubbed per case.
 */
const { send, command } = vi.hoisted(() => ({
  send: vi.fn(),
  command: {
    SendEmailCommand: class {
      constructor(public readonly input: Record<string, unknown>) {}
    },
  },
}));

vi.mock('@aws-sdk/client-sesv2', () => ({
  SESv2Client: class {
    send = send;
  },
  ...command,
}));

/** The SES payload passed to the single SendEmailCommand the adapter issued. */
function sentInput(): Record<string, unknown> {
  return send.mock.calls[0]?.[0]?.input;
}

const config = { AWS_REGION: 'us-east-1', AWS_DYNAMODB_TABLE_PREFIX: '' };

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

  it('issues a SendEmailCommand with the normalized fields and maps MessageId to id', async () => {
    send.mockResolvedValue({ MessageId: 'ses_msg_1' });

    const result = await createSesEmail(config).send(params);

    expect(result.ok && result.value.id).toBe('ses_msg_1');
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
  });

  it('includes the plain-text body when provided', async () => {
    send.mockResolvedValue({ MessageId: 'ses_msg_2' });

    await createSesEmail(config).send({ ...params, text: 'Hi' });

    const content = sentInput().Content as { Simple: { Body: Record<string, unknown> } };
    expect(content.Simple.Body).toEqual({
      Html: { Data: '<p>Hi</p>' },
      Text: { Data: 'Hi' },
    });
  });

  it('maps an SDK error to fail("email_send_failed")', async () => {
    send.mockRejectedValue(new Error('email address is not verified'));

    const result = await createSesEmail(config).send(params);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('email_send_failed');
      expect(result.error.message).toBe('email address is not verified');
    }
  });

  it('fails when SES returns no MessageId', async () => {
    send.mockResolvedValue({});
    const result = await createSesEmail(config).send(params);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('email_send_failed');
  });
});
