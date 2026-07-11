import { decodeResendSendResponse } from '@vybekiit/core/http';
import { Effect } from 'effect';
import type { ResendEmailConfigType } from '../../config';
import { caughtMessage, emailError, failEmail } from '../../emailEffect';
import type { EmailError, EmailProvider, SendEmailParamsType } from '../../types';

/**
 * Transport used by the Resend email adapter.
 *
 * Injected so tests can run without touching the Resend API.
 */
export type ResendFetchLike = (
  url: string,
  init: {
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly body: string;
  },
) => Promise<ResendResponse>;

type ResendResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<unknown>;
  readonly text: () => Promise<string>;
};

/**
 * POST a normalized email payload to Resend.
 *
 * @param config - Resend API credentials.
 * @param fetchImpl - Transport used for the request.
 * @param params - Email send parameters.
 * @returns Effect that succeeds with the raw Resend response.
 * @example
 * const response = await Effect.runPromise(postResendEmail(config, fetch, params));
 */
const postResendEmail = (
  config: ResendEmailConfigType,
  fetchImpl: ResendFetchLike,
  params: SendEmailParamsType,
): Effect.Effect<ResendResponse, EmailError> => {
  const body =
    params.text === undefined
      ? {
          from: params.from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }
      : {
          from: params.from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        };

  return Effect.tryPromise({
    try: () =>
      fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }),
    catch: (caught) =>
      emailError({
        code: 'EMAIL_SEND_FAILED',
        message: `Could not reach Resend: ${caughtMessage(caught)}`,
      }),
  });
};

/**
 * Read the response body for a failed Resend request.
 *
 * @param response - Raw Resend response.
 * @returns Effect that yields a detail string, or an empty string when unreadable.
 * @example
 * const detail = await Effect.runPromise(readResendErrorDetail(response));
 */
const readResendErrorDetail = (response: ResendResponse): Effect.Effect<string> =>
  Effect.tryPromise({
    try: () => response.text(),
    catch: () =>
      emailError({
        code: 'EMAIL_INVALID_RESPONSE',
        message: 'Resend returned an unreadable error response.',
      }),
  }).pipe(Effect.catchAll(() => Effect.succeed('')));

/**
 * Fail with a typed email error for a non-2xx Resend response.
 *
 * @param response - Raw Resend response.
 * @returns Failing Effect with an EmailError.
 * @example
 * const failure = failResendStatus(response);
 */
const failResendStatus = (response: ResendResponse): Effect.Effect<never, EmailError> =>
  Effect.gen(function* () {
    const detail = yield* readResendErrorDetail(response);
    const message = detail.length === 0 ? `Resend returned ${response.status}.` : detail;
    return yield* failEmail({
      code: 'EMAIL_SEND_FAILED',
      message,
    });
  });

/**
 * Decode the message id returned by Resend.
 *
 * @param response - Raw Resend response.
 * @returns Effect that succeeds with the message id.
 * @example
 * const id = await Effect.runPromise(decodeResendMessageId(response));
 */
const decodeResendMessageId = (response: ResendResponse): Effect.Effect<string, EmailError> =>
  Effect.gen(function* () {
    const decoded = decodeResendSendResponse(
      yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (caught) =>
          emailError({
            code: 'EMAIL_INVALID_RESPONSE',
            message: `Resend returned invalid JSON: ${caughtMessage(caught)}`,
          }),
      }),
    );

    if (decoded === null || decoded.id.length === 0) {
      return yield* failEmail({
        code: 'EMAIL_INVALID_RESPONSE',
        message: 'Resend did not return a message id.',
      });
    }

    return decoded.id;
  });

/**
 * Build the Resend email provider.
 *
 * @param config - Resend API credentials decoded from `ResendEmailConfig`.
 * @param fetchImpl - Transport used to call Resend's send endpoint.
 * @returns An email provider whose `send` method returns an Effect with typed email failures.
 * @example
 * const provider = createResendEmail(config, fetch);
 * const sent = await Effect.runPromise(provider.send(params));
 */
export const createResendEmail = (
  config: ResendEmailConfigType,
  fetchImpl: ResendFetchLike = globalThis.fetch,
): EmailProvider => ({
  name: 'resend',

  send: (params: SendEmailParamsType) =>
    Effect.gen(function* () {
      const response = yield* postResendEmail(config, fetchImpl, params);

      if (response.ok === false) {
        return yield* failResendStatus(response);
      }

      return { id: yield* decodeResendMessageId(response) };
    }),
});
