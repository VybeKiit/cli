import { parseEnv } from '@vybekiit/core';
import { TwilioConfigSchema, type TwilioConfigType } from '@vybekiit/notifications/config';
import {
  NotificationsError,
  type NotificationsProvider,
  type SendNotificationParamsType,
} from '@vybekiit/notifications/types';
import { Effect } from 'effect';
import { sendTwilioSmsOtp, sendTwilioWhatsApp } from './twilio';

/**
 * Build a notifications adapter backed by Twilio SMS and optional WhatsApp delivery.
 *
 * @param config - Validated Twilio credentials and sender configuration.
 * @returns A notifications provider for SMS and Twilio WhatsApp delivery.
 * @example
 * const notifications = createTwilioNotifications(resolveTwilioConfig(process.env));
 */
export const createTwilioNotifications = (config: TwilioConfigType): NotificationsProvider => ({
  name: 'twilio',
  send: (params: SendNotificationParamsType) => {
    if (params.channel === 'sms') {
      return sendTwilioSmsOtp(params.to, config).pipe(Effect.as({ id: 'twilio-sms' }));
    }

    if (params.channel === 'push') {
      return Effect.fail(
        new NotificationsError({
          code: 'NOTIFICATIONS_INVALID_CHANNEL',
          message: 'Twilio adapter does not support push; use Expo.',
        }),
      );
    }

    if (params.data !== undefined && params.data.channel === 'whatsapp') {
      return sendTwilioWhatsApp(params.to, params.body, config).pipe(
        Effect.map((result) => ({ id: result.sid })),
      );
    }

    return Effect.fail(
      new NotificationsError({
        code: 'NOTIFICATIONS_INVALID_CHANNEL',
        message: 'Unsupported notification channel for Twilio.',
      }),
    );
  },
  verifyDelivery: () => {
    if (config.TWILIO_ACCOUNT_SID.length === 0) {
      return Effect.fail(
        new NotificationsError({
          code: 'NOTIFICATIONS_CONFIG_INVALID',
          message: 'Twilio is not configured.',
        }),
      );
    }
    return Effect.succeed(true);
  },
});

/**
 * Parse Twilio configuration from an environment source.
 *
 * @param env - Environment variables containing Twilio credentials.
 * @returns Validated Twilio configuration.
 * @example
 * const config = resolveTwilioConfig(process.env);
 */
export const resolveTwilioConfig = (env: Record<string, string | undefined>): TwilioConfigType =>
  parseEnv(TwilioConfigSchema, env);
