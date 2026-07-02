import { fail, ok, type Result, type TwilioConfig } from '@vybekiit/core';

// SMS one-time-code send/verify, absorbed from @vybekiit/notifications so auth is
// self-contained and the spine no longer depends on a template-owned concern (ADR-0025).
// notifications keeps its own Twilio copy for WhatsApp/push; this is the auth-owned OTP path.

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
    const json = (await res.json()) as { status?: string };
    if (json.status !== 'approved') {
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
