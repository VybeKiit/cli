import type {
  NotificationsProvider,
  SendNotificationParamsType,
} from '@vybekiit/notifications/types';
import { Effect } from 'effect';

/**
 * Build a local notifications adapter for tests and offline template flows.
 *
 * @returns A notifications provider that acknowledges delivery without external IO.
 * @example
 * const notifications = createLocalNotifications();
 */
export const createLocalNotifications = (): NotificationsProvider => ({
  name: 'local',
  send: (_params: SendNotificationParamsType) => Effect.succeed({ id: 'local-notification' }),
  verifyDelivery: () => Effect.succeed(true),
});
