import { decodeExpoPushSendResponse } from '@vybekiit/core/http';
import { Effect } from 'effect';
import type { ExpoPushConfigType } from '../config';
import { resolveNotificationSubject } from '../notificationSubject';
import {
  NotificationsError,
  type NotificationsProvider,
  type SendNotificationParamsType,
} from '../types';

const notificationsErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const expoHeaders = (config: ExpoPushConfigType): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.EXPO_ACCESS_TOKEN !== undefined) {
    headers.Authorization = `Bearer ${config.EXPO_ACCESS_TOKEN}`;
  }

  return headers;
};

const sendExpoPushRequest = (
  config: ExpoPushConfigType,
  params: SendNotificationParamsType,
): Effect.Effect<unknown, NotificationsError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: expoHeaders(config),
        body: JSON.stringify({
          to: params.to,
          title: resolveNotificationSubject(params.subject),
          body: params.body,
          data: params.data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Expo push returned ${response.status}.`);
      }

      return response.json();
    },
    catch: (caught) =>
      new NotificationsError({
        code: 'NOTIFICATIONS_SEND_FAILED',
        message: notificationsErrorMessage(caught),
      }),
  });

/**
 * Build a notifications adapter that sends push messages through Expo.
 *
 * @param config - Validated Expo push configuration.
 * @returns A notifications provider for the `push` channel.
 * @example
 * const notifications = createExpoNotifications({ EXPO_ACCESS_TOKEN: 'token' });
 */
export const createExpoNotifications = (config: ExpoPushConfigType): NotificationsProvider => ({
  name: 'expo',
  send: (params: SendNotificationParamsType) => {
    if (params.channel !== 'push') {
      return Effect.fail(
        new NotificationsError({
          code: 'NOTIFICATIONS_INVALID_CHANNEL',
          message: 'Expo adapter only supports push channel.',
        }),
      );
    }

    return sendExpoPushRequest(config, params).pipe(
      Effect.flatMap((response) => {
        const json = decodeExpoPushSendResponse(response);
        if (json === null || json.data === undefined || json.data.id === undefined) {
          return Effect.fail(
            new NotificationsError({
              code: 'NOTIFICATIONS_SEND_FAILED',
              message: 'Expo push response did not include a ticket id.',
            }),
          );
        }

        return Effect.succeed({ id: json.data.id });
      }),
    );
  },
  verifyDelivery: () => Effect.succeed(true),
});
