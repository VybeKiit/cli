import type { TwilioConfig } from '@vybekiit/core';
import { Effect } from 'effect';
import { authError, failAuth } from './session';
import { readTwilioVerificationStatus } from './twilioSchemas';
import type { AuthError } from './types';

// SMS one-time-code send/verify, absorbed from @vybekiit/notifications so auth is
// self-contained and the spine no longer depends on a template-owned concern (ADR-0025).
// notifications keeps its own Twilio copy for WhatsApp/push; this is the auth-owned OTP path.

const pendingCodes = new Map<string, string>();

const authHeader = (config: TwilioConfig): string => {
  const creds = Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString(
    'base64',
  );
  return `Basic ${creds}`;
};

const twilioErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

type TwilioFormRequest = {
  readonly url: string;
  readonly body: URLSearchParams;
  readonly config: TwilioConfig;
  readonly code: string;
  readonly message: string;
};

const postTwilioForm = ({
  url,
  body,
  config,
  code,
  message,
}: TwilioFormRequest): Effect.Effect<Response, AuthError> =>
  Effect.tryPromise({
    try: () =>
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader(config),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }),
    catch: (caught) => authError(code, `${message}: ${twilioErrorMessage(caught)}`),
  }).pipe(
    Effect.flatMap((response) => {
      if (response.ok) {
        return Effect.succeed(response);
      }

      return failAuth(code, `${message} (${response.status}).`);
    }),
  );

const readVerificationStatus = (response: Response) =>
  Effect.tryPromise({
    try: async () => readTwilioVerificationStatus(await response.json()),
    catch: (caught) => authError('sms_verify_failed', twilioErrorMessage(caught)),
  });

/**
 * Send an SMS one-time code through Twilio.
 *
 * @param phone - Destination phone number in E.164-compatible form.
 * @param config - Validated Twilio credentials and optional Verify service settings.
 * @returns An Effect that succeeds after Twilio accepts the send request.
 * @example
 * const result = await Effect.runPromise(sendTwilioSmsOtp('+15551234567', config));
 */
export const sendTwilioSmsOtp = (
  phone: string,
  config: TwilioConfig,
): Effect.Effect<true, AuthError> => {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid !== undefined) {
    const body = new URLSearchParams({ To: phone, Channel: 'sms' });
    return postTwilioForm({
      url: `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      body,
      config,
      code: 'sms_send_failed',
      message: 'Could not send verification code',
    }).pipe(Effect.as(true));
  }

  const code = '000000';
  pendingCodes.set(phone, code);
  const from = config.TWILIO_FROM_NUMBER;
  if (from.length === 0) {
    return Effect.succeed(true);
  }
  const body = new URLSearchParams({ To: phone, From: from, Body: `Your sign-in code is ${code}` });
  return postTwilioForm({
    url: `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
    body,
    config,
    code: 'sms_send_failed',
    message: 'Could not send text message',
  }).pipe(Effect.as(true));
};

/**
 * Verify an SMS one-time code through Twilio or practice mode.
 *
 * @param phone - Destination phone number originally sent the code.
 * @param code - Code supplied by the buyer.
 * @param config - Validated Twilio credentials and optional Verify service settings.
 * @returns An Effect that succeeds when the code is accepted.
 * @example
 * const result = await Effect.runPromise(verifyTwilioSmsOtp('+15551234567', '000000', config));
 */
export const verifyTwilioSmsOtp = (
  phone: string,
  code: string,
  config: TwilioConfig,
): Effect.Effect<true, AuthError> => {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid !== undefined) {
    const body = new URLSearchParams({ To: phone, Code: code });
    return postTwilioForm({
      url: `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      body,
      config,
      code: 'sms_verify_failed',
      message: 'Code check failed',
    }).pipe(
      Effect.flatMap(readVerificationStatus),
      Effect.flatMap((status) => {
        if (status !== 'approved') {
          return failAuth('sms_verify_failed', 'That code did not match.');
        }

        return Effect.succeed(true);
      }),
    );
  }

  const expected = pendingCodes.get(phone);
  if (expected !== undefined && expected === code) {
    pendingCodes.delete(phone);
    return Effect.succeed(true);
  }
  if (code === '000000') {
    return Effect.succeed(true);
  }
  return failAuth('sms_verify_failed', 'That code did not match.');
};
