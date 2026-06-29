import { type ExpoPushConfig, fail, ok, type Result } from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '../types';

export function createExpoNotifications(config: ExpoPushConfig): NotificationsProvider {
  return {
    name: 'expo',
    async send(params: SendNotificationParams): Promise<Result<{ id: string }>> {
      if (params.channel !== 'push') {
        return fail('invalid_channel', 'Expo adapter only supports push channel');
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.EXPO_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${config.EXPO_ACCESS_TOKEN}`;
      }
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: params.to,
          title: params.subject ?? 'Notification',
          body: params.body,
          data: params.data,
        }),
      });
      if (!res.ok) {
        return fail('push_failed', `Expo push returned ${res.status}`);
      }
      const json = (await res.json()) as { data?: { id?: string } };
      return ok({ id: json.data?.id ?? 'expo-push' });
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
