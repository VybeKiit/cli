import { type CloudflareEmailConfig, fail, ok, type Result } from '@vybekiit/core';
import { decodeIdResponse } from '@vybekiit/core/http';
import { toWorkerSendBody } from '@vybekiit/email/cloudflare/workerContract';
import type { EmailProvider, SendEmailParams } from '@vybekiit/email/types';

/**
 * The `fetch` implementation the adapter posts through. Injected (default
 * `globalThis.fetch`) so tests mock the transport without a network call, and so the
 * adapter never assumes a specific runtime's global. Narrowed to just the call shape
 * we use, to avoid depending on DOM lib types in this package.
 */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** Reads the message id from the send endpoint's JSON response, if present. */
function readMessageId(body: unknown): string | null {
  return decodeIdResponse(body);
}

/**
 * Build the Cloudflare {@link EmailProvider} — VybeKiit's v1 default sender.
 *
 * Constraint: Cloudflare has no general outbound email API. Transactional mail is
 * sent from the deployed Worker/Pages context, which exposes its own send route; this
 * adapter POSTs to that route (`CLOUDFLARE_EMAIL_ENDPOINT`) with
 * {@link EMAIL_WORKER_SECRET} as a bearer credential. `fetch` is injectable so the
 * boundary is unit testable without a network or live Worker.
 *
 * @param config - email worker credentials from {@link cloudflareEmailConfigSchema}
 * @param fetchImpl - transport; defaults to `globalThis.fetch`
 */
export function createCloudflareEmail(
  config: CloudflareEmailConfig,
  fetchImpl: FetchLike = globalThis.fetch,
): EmailProvider {
  return {
    name: 'cloudflare',

    async send(params: SendEmailParams): Promise<Result<{ id: string }>> {
      const endpoint = config.CLOUDFLARE_EMAIL_ENDPOINT;

      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${config.EMAIL_WORKER_SECRET}`,
          },
          body: JSON.stringify(toWorkerSendBody(params)),
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown network error';
        return fail('network_error', `Could not reach the email endpoint: ${detail}`);
      }

      if (!response.ok) {
        return fail('api_error', `Email endpoint returned status ${response.status}.`);
      }

      const id = readMessageId(await response.json());
      if (!id) {
        return fail('invalid_response', 'Email endpoint did not return a message id.');
      }
      return ok({ id });
    },
  };
}
