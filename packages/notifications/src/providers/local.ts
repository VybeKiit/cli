import { ok, type Result } from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '@vybekiit/notifications/types';

export function createLocalNotifications(): NotificationsProvider {
  return {
    name: 'local',
    async send(_params: SendNotificationParams): Promise<Result<{ id: string }>> {
      return ok({ id: 'local-notification' });
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
