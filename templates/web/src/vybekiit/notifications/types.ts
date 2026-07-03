import type { Result } from '@vybekiit/core';

export type NotificationChannel = 'email' | 'push' | 'sms';
export type NotificationsProviderName = 'expo' | 'twilio' | 'email' | 'local';

export interface SendNotificationParams {
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly subject?: string | undefined;
  readonly body: string;
  readonly data?: Record<string, string> | undefined;
}

export interface NotificationsProvider {
  readonly name: NotificationsProviderName;
  send(params: SendNotificationParams): Promise<Result<{ id: string }>>;
  verifyDelivery(): Promise<Result<true>>;
}
