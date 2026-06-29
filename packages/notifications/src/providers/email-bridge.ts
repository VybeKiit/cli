import { resolveEmailProvider } from '@vybekiit/email';
import { fail, ok, type Result } from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '../types';

export function createEmailBridgeNotifications(): NotificationsProvider {
  return {
    name: 'email',
    async send(params: SendNotificationParams): Promise<Result<{ id: string }>> {
      if (params.channel !== 'email') {
        return fail('invalid_channel', 'Email bridge only supports email channel');
      }
      const email = resolveEmailProvider();
      const from = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'noreply@example.com';
      return email.send({
        from,
        to: params.to,
        subject: params.subject ?? 'Notification',
        html: params.body,
        text: params.body,
      });
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
