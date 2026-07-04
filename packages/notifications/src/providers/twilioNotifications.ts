import {
  fail,
  ok,
  parseEnv,
  type Result,
  type TwilioConfig,
  twilioConfigSchema,
} from '@vybekiit/core';
import type { NotificationsProvider, SendNotificationParams } from '@vybekiit/notifications/types';
import { sendTwilioSmsOtp, sendTwilioWhatsApp } from './twilio';

export function createTwilioNotifications(config: TwilioConfig): NotificationsProvider {
  return {
    name: 'twilio',
    async send(params: SendNotificationParams): Promise<Result<{ id: string }>> {
      if (params.channel === 'sms') {
        const result = await sendTwilioSmsOtp(params.to, config);
        if (!result.ok) return fail(result.error.code, result.error.message);
        return ok({ id: 'twilio-sms' });
      }
      if (params.channel === 'push') {
        return fail('invalid_channel', 'Twilio adapter does not support push — use Expo.');
      }
      const waConfig = config as TwilioConfig & { TWILIO_WHATSAPP_FROM?: string };
      if (params.data?.channel === 'whatsapp' && waConfig.TWILIO_WHATSAPP_FROM) {
        const result = await sendTwilioWhatsApp(params.to, params.body, waConfig);
        if (!result.ok) return fail(result.error.code, result.error.message);
        return ok({ id: result.value.sid });
      }
      return fail('invalid_channel', 'Unsupported notification channel for Twilio.');
    },
    async verifyDelivery(): Promise<Result<true>> {
      if (!config.TWILIO_ACCOUNT_SID) {
        return fail('config_missing', 'Twilio is not configured.');
      }
      return ok(true);
    },
  };
}

export function resolveTwilioConfig(env: Record<string, string | undefined>): TwilioConfig {
  return parseEnv(twilioConfigSchema, env);
}
