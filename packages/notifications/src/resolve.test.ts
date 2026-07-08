import { it } from '@effect/vitest';
import { resolveNotificationsService } from '@vybekiit/notifications/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveNotificationsService', () => {
  it.effect('defaults to expo provider', () =>
    Effect.gen(function* () {
      const notifications = yield* resolveNotificationsService({
        NOTIFICATIONS_PROVIDER: 'expo',
      });

      expect(notifications.name).toBe('expo');
    }),
  );

  it.effect('local provider succeeds with an Effect result', () =>
    Effect.gen(function* () {
      const notifications = yield* resolveNotificationsService({
        NOTIFICATIONS_PROVIDER: 'local',
      });
      const result = yield* notifications.send({
        channel: 'push',
        to: 'ExponentPushToken[xxx]',
        body: 'hello',
      });

      expect(result.id).toBe('local-notification');
    }),
  );

  it.effect('returns a typed error for an invalid provider key', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveNotificationsService({
          NOTIFICATIONS_PROVIDER: 'unknown',
        }),
      );

      expect(error.code).toBe('NOTIFICATIONS_CONFIG_INVALID');
    }),
  );
});
