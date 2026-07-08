import { decodeIdResponse } from '@vybekiit/core/http';
import { toWorkerSendBody } from '@vybekiit/email/cloudflare/workerContract';
import type { CloudflareEmailConfigType } from '@vybekiit/email/config';
import { caughtMessage, emailError, failEmail } from '@vybekiit/email/emailEffect';
import type { EmailProvider, SendEmailParamsType } from '@vybekiit/email/types';
import { Effect } from 'effect';

/**
 * Transport used by the Cloudflare email adapter.
 *
 * Injected so tests mock the boundary without a live Worker endpoint.
 */
export type FetchLike = (
  url: string,
  init: {
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly body: string;
  },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<unknown>;
}>;

/**
 * Decode the message id returned by the Cloudflare email worker.
 *
 * @param body - Unknown worker response body.
 * @returns Message id, or `null` when the shape is invalid.
 * @example
 * const id = readMessageId(body);
 */
const readMessageId = (body: unknown): string | null => decodeIdResponse(body);

/**
 * Build the Cloudflare email provider.
 *
 * @param config - Cloudflare email worker credentials decoded from `CloudflareEmailConfig`.
 * @param fetchImpl - Transport used to POST the worker send request.
 * @returns An email provider whose `send` method returns an Effect with typed email failures.
 * @example
 * const provider = createCloudflareEmail(config, fetch);
 * const sent = await Effect.runPromise(provider.send(params));
 */
export const createCloudflareEmail = (
  config: CloudflareEmailConfigType,
  fetchImpl: FetchLike = globalThis.fetch,
): EmailProvider => ({
  name: 'cloudflare',

  send: (params: SendEmailParamsType) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetchImpl(config.CLOUDFLARE_EMAIL_ENDPOINT, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${config.EMAIL_WORKER_SECRET}`,
            },
            body: JSON.stringify(toWorkerSendBody(params)),
          }),
        catch: (caught) =>
          emailError({
            code: 'EMAIL_SEND_FAILED',
            message: `Could not reach the email endpoint: ${caughtMessage(caught)}`,
          }),
      });

      if (response.ok === false) {
        return yield* failEmail({
          code: 'EMAIL_SEND_FAILED',
          message: `Email endpoint returned status ${response.status}.`,
        });
      }

      const id = readMessageId(
        yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (caught) =>
            emailError({
              code: 'EMAIL_INVALID_RESPONSE',
              message: `Email endpoint returned invalid JSON: ${caughtMessage(caught)}`,
            }),
        }),
      );

      if (id === null) {
        return yield* failEmail({
          code: 'EMAIL_INVALID_RESPONSE',
          message: 'Email endpoint did not return a message id.',
        });
      }

      return { id };
    }),
});
