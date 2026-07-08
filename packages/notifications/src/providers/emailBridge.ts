import process from 'node:process';
import { type EmailProvider, makeEmailLive, sendEmail } from '@vybekiit/email';
import { resolveNotificationSubject } from '@vybekiit/notifications/notificationSubject';
import {
  NotificationsError,
  type NotificationsProvider,
  type SendNotificationParamsType,
} from '@vybekiit/notifications/types';
import { Effect } from 'effect';

/** Optional dependencies injected by tests or composition roots. */
export type ResolveNotificationsInjections = {
  readonly emailProvider?: EmailProvider;
  readonly fromEmail?: string;
};

const resolveFromEmail = (injections: ResolveNotificationsInjections): string | undefined => {
  if (injections.fromEmail !== undefined) {
    return injections.fromEmail;
  }

  return process.env.NOTIFICATIONS_FROM_EMAIL;
};

const sendViaEmailProvider = (
  emailProvider: EmailProvider | undefined,
  params: Parameters<EmailProvider['send']>[0],
): ReturnType<EmailProvider['send']> => {
  if (emailProvider !== undefined) {
    return emailProvider.send(params);
  }

  return sendEmail(params).pipe(Effect.provide(makeEmailLive(process.env)));
};

/**
 * Build a notifications adapter that delivers email notifications through `@vybekiit/email`.
 *
 * @param injections - Optional email provider and sender address overrides for tests.
 * @returns A notifications provider that maps email failures into NotificationsError.
 * @example
 * const notifications = createEmailBridgeNotifications({ emailProvider, fromEmail });
 * const sent = await Effect.runPromise(notifications.send({ channel: 'email', to, body }));
 */
export const createEmailBridgeNotifications = (
  injections: ResolveNotificationsInjections = {},
): NotificationsProvider => ({
  name: 'email',

  send: (params: SendNotificationParamsType) => {
    if (params.channel !== 'email') {
      return Effect.fail(
        new NotificationsError({
          code: 'NOTIFICATIONS_INVALID_CHANNEL',
          message: 'Email bridge only supports email channel.',
        }),
      );
    }

    const from = resolveFromEmail(injections);
    if (from === undefined || from.length === 0) {
      return Effect.fail(
        new NotificationsError({
          code: 'NOTIFICATIONS_CONFIG_INVALID',
          message: 'Set NOTIFICATIONS_FROM_EMAIL before sending email notifications.',
        }),
      );
    }

    return sendViaEmailProvider(injections.emailProvider, {
      from,
      to: params.to,
      subject: resolveNotificationSubject(params.subject),
      html: params.body,
      text: params.body,
    }).pipe(
      Effect.mapError(
        (error) =>
          new NotificationsError({
            code: 'NOTIFICATIONS_SEND_FAILED',
            message: error.message,
          }),
      ),
    );
  },

  verifyDelivery: () => Effect.succeed(true),
});
