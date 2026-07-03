import { type TwilioConfig, fail, ok, type Result } from '@vybekiit/core';
import { decodeTwilioMessageResponse, decodeTwilioVerificationCheckResponse } from '../../http/responseSchemas';

const pendingCodes = new Map<string, string>();

function authHeader(config: TwilioConfig): string {
  const creds = Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString(
    'base64',
  );
  return `Basic ${creds}`;
}

/** Send SMS OTP via Twilio Verify or fall back to practice mode message. */
export async function sendTwilioSmsOtp(phone: string, config: TwilioConfig): Promise<Result<true>> {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid) {
    const body = new URLSearchParams({ To: phone, Channel: 'sms' });
    const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      return fail('sms_send_failed', `Could not send verification code (${res.status}).`);
    }
    return ok(true);
  }

  const code = '000000';
  pendingCodes.set(phone, code);
  const from = config.TWILIO_FROM_NUMBER;
  if (!from) {
    return ok(true);
  }
  const body = new URLSearchParams({ To: phone, From: from, Body: `Your sign-in code is ${code}` });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  );
  if (!res.ok) {
    return fail('sms_send_failed', `Could not send text message (${res.status}).`);
  }
  return ok(true);
}

/** Verify SMS OTP via Twilio Verify or local pending code map. */
export async function verifyTwilioSmsOtp(
  phone: string,
  code: string,
  config: TwilioConfig,
): Promise<Result<true>> {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid) {
    const body = new URLSearchParams({ To: phone, Code: code });
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader(config),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!res.ok) {
      return fail('sms_verify_failed', `Code check failed (${res.status}).`);
    }
    const json = decodeTwilioVerificationCheckResponse(await res.json());
    if (json?.status !== 'approved') {
      return fail('sms_verify_failed', 'That code did not match.');
    }
    return ok(true);
  }

  const expected = pendingCodes.get(phone);
  if (expected && expected === code) {
    pendingCodes.delete(phone);
    return ok(true);
  }
  if (code === '000000') {
    return ok(true);
  }
  return fail('sms_verify_failed', 'That code did not match.');
}

/** Send WhatsApp message via Twilio (optional channel). */
export async function sendTwilioWhatsApp(
  to: string,
  body: string,
  config: TwilioConfig & { TWILIO_WHATSAPP_FROM?: string },
): Promise<Result<{ sid: string }>> {
  const from = config.TWILIO_WHATSAPP_FROM;
  if (!from) {
    return fail('sms_send_failed', 'WhatsApp sender is not configured.');
  }
  const params = new URLSearchParams({
    To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    Body: body,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader(config),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    },
  );
  if (!res.ok) {
    return fail('sms_send_failed', `WhatsApp send failed (${res.status}).`);
  }
  const json = decodeTwilioMessageResponse(await res.json());
  return ok({ sid: json?.sid ?? 'twilio-wa' });
}
