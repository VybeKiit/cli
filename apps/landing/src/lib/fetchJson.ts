import { fail, ok, type Result } from '@vybekiit/core';

/**
 * The single place the store's client talks to its own API routes.
 *
 * Mirrors `templates/web/src/lib/fetch-json.ts`: every call returns a {@link Result}
 * (never throws for expected failures) so UI branches on `ok` and translates
 * failures into plain language. Non-2xx responses become `http_error`; a thrown
 * `fetch` (offline, DNS) becomes `network_error`.
 */

/** Shape we opportunistically read an error message from on a non-2xx body. */
interface ErrorBody {
  readonly error?: string;
  readonly message?: string;
}

/**
 * Pull a human-readable message from a failed response, falling back to the
 * HTTP status line when the body has none (or isn't JSON).
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: ErrorBody = await response.json();
    return body.error ?? body.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

/**
 * POST a JSON body to a URL and parse the JSON response as `T`.
 *
 * @typeParam T - the expected JSON shape on success.
 * @param body - serialized to JSON; typed `unknown` since callers vary per route.
 */
export async function postJson<T>(url: string, body: unknown): Promise<Result<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return fail('http_error', await readErrorMessage(response));
    }
    // Single boundary cast: the network gives us `unknown` JSON; callers own `T`.
    return ok((await response.json()) as T);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Network request failed.';
    return fail('network_error', message);
  }
}
