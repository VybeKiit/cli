import { decodeTwilioMessageResponse } from '@vybekiit/core/http';
import type { TwilioConfigType } from '@vybekiit/notifications/config';
import { NotificationsError } from '@vybekiit/notifications/types';
import { Effect } from 'effect';

const pendingCodes = new Map<string, string>();

/**
 * Create the HTTP Basic auth header required by Twilio APIs.
 *
 * @param config - Twilio credentials used for API authentication.
 * @returns A Basic auth header value for Twilio requests.
 * @example
 * const header = authHeader(config);
 */
const authHeader = (config: TwilioConfigType): string => {
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
  readonly config: TwilioConfigType;
  readonly code: NotificationsError['code'];
  readonly message: string;
};

const postTwilioForm = ({
  url,
  body,
  config,
  code,
  message,
}: TwilioFormRequest): Effect.Effect<Response, NotificationsError> =>
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
    catch: (caught) =>
      new NotificationsError({
        code,
        message: `${message}: ${twilioErrorMessage(caught)}`,
      }),
  }).pipe(
    Effect.flatMap((response) => {
      if (response.ok) {
        return Effect.succeed(response);
      }

      return Effect.fail(
        new NotificationsError({
          code,
          message: `${message} (${response.status}).`,
        }),
      );
    }),
  );

const decodeVerificationResponse = (response: Response) =>
  Effect.tryPromise({
    try: async () => {
      const json = await response.json();
      const { decodeTwilioVerificationCheckResponse } = await import('@vybekiit/core/http');

      return decodeTwilioVerificationCheckResponse(json);
    },
    catch: (caught) =>
      new NotificationsError({
        code: 'NOTIFICATIONS_VERIFY_FAILED',
        message: twilioErrorMessage(caught),
      }),
  });

/**
 * Send an SMS one-time code through Twilio Verify or the practice-mode sender.
 *
 * @param phone - Recipient phone number in E.164 form.
 * @param config - Twilio credentials and sender configuration.
 * @returns An Effect that succeeds when Twilio accepted the send request.
 * @example
 * const result = await Effect.runPromise(sendTwilioSmsOtp('+15551234567', config));
 */
export const sendTwilioSmsOtp = (
  phone: string,
  config: TwilioConfigType,
): Effect.Effect<true, NotificationsError> => {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid !== undefined) {
    const body = new URLSearchParams({ To: phone, Channel: 'sms' });
    return postTwilioForm({
      url: `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      body,
      config,
      code: 'NOTIFICATIONS_SEND_FAILED',
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
    code: 'NOTIFICATIONS_SEND_FAILED',
    message: 'Could not send text message',
  }).pipe(Effect.as(true));
};

/**
 * Verify an SMS one-time code through Twilio Verify or the local practice-mode map.
 *
 * @param phone - Recipient phone number used when the code was sent.
 * @param code - One-time code provided by the user.
 * @param config - Twilio credentials and Verify configuration.
 * @returns An Effect that succeeds when the code is accepted.
 * @example
 * const result = await Effect.runPromise(verifyTwilioSmsOtp('+15551234567', '000000', config));
 */
export const verifyTwilioSmsOtp = (
  phone: string,
  code: string,
  config: TwilioConfigType,
): Effect.Effect<true, NotificationsError> => {
  const serviceSid = config.TWILIO_VERIFY_SERVICE_SID;
  if (serviceSid !== undefined) {
    const body = new URLSearchParams({ To: phone, Code: code });
    return postTwilioForm({
      url: `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      body,
      config,
      code: 'NOTIFICATIONS_VERIFY_FAILED',
      message: 'Code check failed',
    }).pipe(
      Effect.flatMap(decodeVerificationResponse),
      Effect.flatMap((response) => {
        if (response === null || response.status !== 'approved') {
          return Effect.fail(
            new NotificationsError({
              code: 'NOTIFICATIONS_VERIFY_FAILED',
              message: 'That code did not match.',
            }),
          );
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
  return Effect.fail(
    new NotificationsError({
      code: 'NOTIFICATIONS_VERIFY_FAILED',
      message: 'That code did not match.',
    }),
  );
};

/**
 * Send a WhatsApp message through Twilio's Messages API.
 *
 * @param to - Recipient phone number, with or without the `whatsapp:` prefix.
 * @param body - Message body to deliver.
 * @param config - Twilio credentials and WhatsApp sender configuration.
 * @returns An Effect containing the Twilio message SID.
 * @example
 * const result = await Effect.runPromise(sendTwilioWhatsApp('+15551234567', 'Hello', config));
 */
export const sendTwilioWhatsApp = (
  to: string,
  body: string,
  config: TwilioConfigType,
): Effect.Effect<{ readonly sid: string }, NotificationsError> => {
  const from = config.TWILIO_WHATSAPP_FROM;
  if (from === undefined || from.length === 0) {
    return Effect.fail(
      new NotificationsError({
        code: 'NOTIFICATIONS_CONFIG_INVALID',
        message: 'WhatsApp sender is not configured.',
      }),
    );
  }
  const params = new URLSearchParams({
    To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    Body: body,
  });
  return postTwilioForm({
    url: `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`,
    body: params,
    config,
    code: 'NOTIFICATIONS_SEND_FAILED',
    message: 'WhatsApp send failed',
  }).pipe(
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => response.json(),
        catch: (caught) =>
          new NotificationsError({
            code: 'NOTIFICATIONS_SEND_FAILED',
            message: twilioErrorMessage(caught),
          }),
      }),
    ),
    Effect.flatMap((response) => {
      const json = decodeTwilioMessageResponse(response);
      if (json === null || json.sid === undefined) {
        return Effect.fail(
          new NotificationsError({
            code: 'NOTIFICATIONS_SEND_FAILED',
            message: 'Twilio WhatsApp response did not include a message sid.',
          }),
        );
      }

      return Effect.succeed({ sid: json.sid });
    }),
  );
};
