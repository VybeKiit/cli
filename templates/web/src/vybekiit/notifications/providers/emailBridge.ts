import { resolveEmailProvider, type EmailProvider } from '../../email';
import { fail, ok, type Result } from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '../types';
import process from 'node:process';

export interface ResolveNotificationsInjections {
  readonly emailProvider?: EmailProvider;
  readonly fromEmail?: string;
}

export function createEmailBridgeNotifications(
  injections: ResolveNotificationsInjections = {},
): NotificationsProvider {
  return {
    name: 'email',
    async send(params: SendNotificationParams): Promise<Result<{ id: string }>> {
      if (params.channel !== 'email') {
        return fail('invalid_channel', 'Email bridge only supports email channel');
      }
      const email = injections.emailProvider ?? resolveEmailProvider();
      const from =
        injections.fromEmail ?? process.env.NOTIFICATIONS_FROM_EMAIL ?? 'noreply@example.com';
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
