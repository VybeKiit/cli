import {
  expoPushConfigSchema,
  notificationsConfigSchema,
  parseEnv,
  twilioConfigSchema,
} from '@vybekiit/core';
import { createEmailBridgeNotifications } from './providers/email-bridge';
import { createExpoNotifications } from './providers/expo';
import { createLocalNotifications } from './providers/local';
import { createTwilioNotifications } from './providers/twilio-notifications';
import type { NotificationsProvider } from './types';

type EnvSource = Record<string, string | undefined>;

export function resolveNotificationsProvider(env: EnvSource = process.env): NotificationsProvider {
  const { NOTIFICATIONS_PROVIDER } = parseEnv(notificationsConfigSchema, env);
  switch (NOTIFICATIONS_PROVIDER) {
    case 'email':
      return createEmailBridgeNotifications();
    case 'twilio':
      return createTwilioNotifications(parseEnv(twilioConfigSchema, env));
    case 'local':
      return createLocalNotifications();
    default:
      return createExpoNotifications(parseEnv(expoPushConfigSchema, env));
  }
}
