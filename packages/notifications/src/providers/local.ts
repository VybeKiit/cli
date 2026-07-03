import { type Result, ok } from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '../types';

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
