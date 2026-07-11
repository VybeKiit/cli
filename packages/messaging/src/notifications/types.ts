// biome-ignore-all lint/style/noExcessiveClassesPerFile: Effect error and service contracts intentionally live with the notifications boundary.

import { Data, type Effect, Schema } from 'effect';
import type { NotificationsProviderNameType } from './config';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Provider keys accepted by the notifications resolver. */
export type NotificationsProviderName = NotificationsProviderNameType;

/** Notification delivery channels supported by notifications adapters. */
export const NotificationChannel = Schema.Literal('email', 'push', 'sms');

/** Static type inferred from {@link NotificationChannel}. */
export type NotificationChannelType = Schema.Schema.Type<typeof NotificationChannel>;

/** Notification delivery channel alias retained during the Schema migration. */
export type NotificationChannel = NotificationChannelType;

/** Parameters shared by all notification adapters. */
export const SendNotificationParams = Schema.Struct({
  channel: NotificationChannel,
  to: NonEmptyString,
  subject: Schema.optional(Schema.String),
  body: NonEmptyString,
  data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
});

/** Static type inferred from {@link SendNotificationParams}. */
export type SendNotificationParamsType = Schema.Schema.Type<typeof SendNotificationParams>;

/** Notification send result returned by all adapters. */
export const NotificationSendResult = Schema.Struct({
  id: NonEmptyString,
});

/** Static type inferred from {@link NotificationSendResult}. */
export type NotificationSendResultType = Schema.Schema.Type<typeof NotificationSendResult>;

/** Backward-compatible send parameter type alias during the Schema migration. */
export type SendNotificationParams = SendNotificationParamsType;

/** Expected notifications failures that callers may recover from. */
export class NotificationsError extends Data.TaggedError('NotificationsError')<{
  readonly code:
    | 'NOTIFICATIONS_CONFIG_INVALID'
    | 'NOTIFICATIONS_PROVIDER_UNSUPPORTED'
    | 'NOTIFICATIONS_INVALID_CHANNEL'
    | 'NOTIFICATIONS_SEND_FAILED'
    | 'NOTIFICATIONS_VERIFY_FAILED';
  readonly message: string;
}> {}

/** Effect service contract for notification delivery. */
export type NotificationsService = {
  readonly name: NotificationsProviderName;
  readonly send: (
    params: SendNotificationParamsType,
  ) => Effect.Effect<NotificationSendResultType, NotificationsError>;
  readonly verifyDelivery: () => Effect.Effect<true, NotificationsError>;
};

/** Backward-compatible alias for the notifications service contract. */
export type NotificationsProvider = NotificationsService;
