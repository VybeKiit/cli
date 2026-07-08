import type { SendEmailParamsType } from '@vybekiit/email';
import { createEmailBridgeNotifications } from '@vybekiit/notifications/providers/emailBridge';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

describe('createEmailBridgeNotifications', () => {
  it('sends email notifications through an injected Effect email provider', async () => {
    const send = vi.fn((params: SendEmailParamsType) =>
      Effect.succeed({ id: `email-${params.to}` }),
    );
    const notifications = createEmailBridgeNotifications({
      fromEmail: 'hello@example.com',
      emailProvider: { name: 'cloudflare', send },
    });

    const result = await Effect.runPromise(
      notifications.send({
        channel: 'email',
        to: 'buyer@example.com',
        body: 'Welcome',
      }),
    );

    expect(result.id).toBe('email-buyer@example.com');
    expect(send).toHaveBeenCalledWith({
      from: 'hello@example.com',
      to: 'buyer@example.com',
      subject: 'Notification',
      html: 'Welcome',
      text: 'Welcome',
    });
  });

  it('fails explicitly when no sender address is configured', async () => {
    const notifications = createEmailBridgeNotifications({
      emailProvider: { name: 'cloudflare', send: () => Effect.succeed({ id: 'msg_1' }) },
    });

    const error = await Effect.runPromise(
      Effect.flip(
        notifications.send({
          channel: 'email',
          to: 'buyer@example.com',
          body: 'Welcome',
        }),
      ),
    );

    expect(error.code).toBe('NOTIFICATIONS_CONFIG_INVALID');
  });
});
