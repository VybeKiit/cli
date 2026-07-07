import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  ExpoPushConfigSchema,
  NotificationsConfigSchema,
  type NotificationsConfigType,
  type NotificationsProviderNameType,
  TwilioConfigSchema,
} from './config';
import {
  createEmailBridgeNotifications,
  type ResolveNotificationsInjections,
} from './providers/emailBridge';
import { createExpoNotifications } from './providers/expo';
import { createLocalNotifications } from './providers/local';
import { createTwilioNotifications } from './providers/twilioNotifications';
import { NotificationsError, type NotificationsProvider, type NotificationsService } from './types';

export type { ResolveNotificationsInjections } from './providers/emailBridge';

/** Injectable notifications service tag used by composition roots and tests. */
export class Notifications extends Context.Tag('@vybekiit/notifications/Notifications')<
  Notifications,
  NotificationsService
>() {}

type NotificationsFactory = (
  source: EnvSource,
  injections: ResolveNotificationsInjections,
) => Effect.Effect<NotificationsService, NotificationsError>;

const notificationsFactories: Partial<Record<NotificationsProviderNameType, NotificationsFactory>> =
  {
    email: (_source, injections) => Effect.succeed(createEmailBridgeNotifications(injections)),
    twilio: (source) =>
      parseNotificationsConfigSlice(TwilioConfigSchema, source).pipe(
        Effect.map((config) => createTwilioNotifications(config)),
      ),
    local: () => Effect.succeed(createLocalNotifications()),
    expo: (source) =>
      parseNotificationsConfigSlice(ExpoPushConfigSchema, source).pipe(
        Effect.map((config) => createExpoNotifications(config)),
      ),
  };

const notificationsErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseNotificationsConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, NotificationsError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new NotificationsError({
        code: 'NOTIFICATIONS_CONFIG_INVALID',
        message: notificationsErrorMessage(caught),
      }),
  });

const findNotificationsFactory = (
  provider: NotificationsProviderNameType,
): Effect.Effect<NotificationsFactory, NotificationsError> => {
  const createProvider = notificationsFactories[provider];
  if (createProvider === undefined) {
    return Effect.fail(
      new NotificationsError({
        code: 'NOTIFICATIONS_PROVIDER_UNSUPPORTED',
        message: `No notifications adapter is registered for provider ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured notifications service from environment config.
 *
 * @param source - Raw environment source to decode.
 * @param injections - Optional dependencies for adapters that bridge to other services.
 * @returns An Effect that succeeds with the configured service or fails with NotificationsError.
 * @example
 * const notifications = await Effect.runPromise(resolveNotificationsService(process.env));
 */
export const resolveNotificationsService = (
  source: EnvSource = process.env,
  injections: ResolveNotificationsInjections = {},
): Effect.Effect<NotificationsService, NotificationsError> =>
  parseNotificationsConfigSlice(NotificationsConfigSchema, source).pipe(
    Effect.flatMap(({ NOTIFICATIONS_PROVIDER }: NotificationsConfigType) =>
      findNotificationsFactory(NOTIFICATIONS_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source, injections)),
      ),
    ),
  );

/**
 * Build the configured notifications Layer from environment values.
 *
 * @param source - Raw environment source to decode.
 * @param injections - Optional dependencies for adapters that bridge to other services.
 * @returns A Layer that provides Notifications or fails during construction.
 * @example
 * const layer = makeNotificationsLive({ NOTIFICATIONS_PROVIDER: 'local' });
 */
export const makeNotificationsLive = (
  source: EnvSource = process.env,
  injections: ResolveNotificationsInjections = {},
): Layer.Layer<Notifications, NotificationsError> =>
  Layer.effect(Notifications, resolveNotificationsService(source, injections));

/**
 * Resolve the configured notifications provider from an environment source.
 *
 * @param env - Environment variables used for provider selection and selected adapter config.
 * @param injections - Optional dependencies for adapters that bridge to other services.
 * @returns The notifications provider registered for `NOTIFICATIONS_PROVIDER`.
 * @example
 * const notifications = resolveNotificationsProvider(process.env);
 */
export const resolveNotificationsProvider = (
  env: EnvSource = process.env,
  injections: ResolveNotificationsInjections = {},
): NotificationsProvider => Effect.runSync(resolveNotificationsService(env, injections));
