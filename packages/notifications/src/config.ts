import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Provider keys accepted by the notifications resolver. */
export const NotificationsProviderNameSchema = Schema.Literal('expo', 'twilio', 'email', 'local');

/** Static type inferred from {@link NotificationsProviderNameSchema}. */
export type NotificationsProviderNameType = Schema.Schema.Type<
  typeof NotificationsProviderNameSchema
>;

/** Runtime config for the notifications provider resolver. */
export const NotificationsConfigSchema = Schema.Struct({
  NOTIFICATIONS_PROVIDER: Schema.optionalWith(NotificationsProviderNameSchema, {
    default: () => 'expo' as const,
  }),
});

/** Static type inferred from {@link NotificationsConfigSchema}. */
export type NotificationsConfigType = Schema.Schema.Type<typeof NotificationsConfigSchema>;

/** Expo push notification credentials. */
export const ExpoPushConfigSchema = Schema.Struct({
  EXPO_ACCESS_TOKEN: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link ExpoPushConfigSchema}. */
export type ExpoPushConfigType = Schema.Schema.Type<typeof ExpoPushConfigSchema>;

/** Twilio credentials for SMS and WhatsApp notifications. */
export const TwilioConfigSchema = Schema.Struct({
  TWILIO_ACCOUNT_SID: NonEmptyString,
  TWILIO_AUTH_TOKEN: NonEmptyString,
  TWILIO_FROM_NUMBER: NonEmptyString,
  TWILIO_WHATSAPP_FROM: Schema.optional(NonEmptyString),
  TWILIO_VERIFY_SERVICE_SID: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link TwilioConfigSchema}. */
export type TwilioConfigType = Schema.Schema.Type<typeof TwilioConfigSchema>;
