import { type CloudflareConfig, type Result, fail, ok } from '@vybekiit/core';
import type { EmailProvider, SendEmailParams } from '../../types';

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
  if (typeof body === 'object' && body !== null && 'id' in body) {
    const { id } = body as { id: unknown };
    if (typeof id === 'string') return id;
  }
  return null;
}

/**
 * Build the Cloudflare {@link EmailProvider} — VybeKiit's v1 default sender.
 *
 * Constraint: Cloudflare has no general outbound email API. Transactional mail is
 * sent from the deployed Worker/Pages context, which exposes its own send route; this
 * adapter POSTs to that route (`CLOUDFLARE_EMAIL_ENDPOINT`) with the account API
 * token as a bearer credential. `fetch` is injectable so the boundary is unit
 * testable without a network or live Worker.
 *
 * @param config - Cloudflare credentials; `CLOUDFLARE_EMAIL_ENDPOINT` must be set
 * @param fetchImpl - transport; defaults to `globalThis.fetch`
 */
export function createCloudflareEmail(
  config: CloudflareConfig,
  fetchImpl: FetchLike = globalThis.fetch,
): EmailProvider {
  return {
    name: 'cloudflare',

    async send(params: SendEmailParams): Promise<Result<{ id: string }>> {
      const endpoint = config.CLOUDFLARE_EMAIL_ENDPOINT;
      if (!endpoint) {
        return fail(
          'no_endpoint',
          'Set CLOUDFLARE_EMAIL_ENDPOINT to the Worker/Pages route that sends mail.',
        );
      }

      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
          },
          body: JSON.stringify({
            to: params.to,
            from: params.from,
            subject: params.subject,
            html: params.html,
            ...(params.text ? { text: params.text } : {}),
          }),
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
