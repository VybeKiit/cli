import {
  expoPushConfigSchema,
  notificationsConfigSchema,
  parseEnv,
  resolveEnvProvider,
  twilioConfigSchema,
  type EnvSource,
} from '@vybekiit/core';
import {
  createEmailBridgeNotifications,
  type ResolveNotificationsInjections,
} from './providers/email-bridge';
import { createExpoNotifications } from './providers/expo';
import { createLocalNotifications } from './providers/local';
import { createTwilioNotifications } from './providers/twilio-notifications';
import type { NotificationsProvider } from './types';

export type { ResolveNotificationsInjections } from './providers/email-bridge';

export function resolveNotificationsProvider(
  env: EnvSource = process.env,
  injections: ResolveNotificationsInjections = {},
): NotificationsProvider {
  const { NOTIFICATIONS_PROVIDER } = parseEnv(notificationsConfigSchema, env);
  return resolveEnvProvider(
    NOTIFICATIONS_PROVIDER,
    {
      email: () => createEmailBridgeNotifications(injections),
      twilio: (source) => createTwilioNotifications(parseEnv(twilioConfigSchema, source)),
      local: () => createLocalNotifications(),
      expo: (source) => createExpoNotifications(parseEnv(expoPushConfigSchema, source)),
    },
    env,
    'expo',
  );
}
