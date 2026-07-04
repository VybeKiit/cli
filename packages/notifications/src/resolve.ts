import process from 'node:process';
import {
  type EnvSource,
  expoPushConfigSchema,
  notificationsConfigSchema,
  parseEnv,
  resolveEnvProvider,
  twilioConfigSchema,
} from '@vybekiit/core';
import {
  createEmailBridgeNotifications,
  type ResolveNotificationsInjections,
} from './providers/emailBridge';
import { createExpoNotifications } from './providers/expo';
import { createLocalNotifications } from './providers/local';
import { createTwilioNotifications } from './providers/twilioNotifications';
import type { NotificationsProvider } from './types';

export type { ResolveNotificationsInjections } from './providers/emailBridge';

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
