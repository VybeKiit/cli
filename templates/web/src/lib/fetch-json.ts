import { type Result, fail, ok } from '@vybekiit/core';

/**
 * The single place the web template talks to its own API routes.
 *
 * Every call returns a {@link Result} (never throws for expected failures) so UI
 * and hooks branch on `ok` and translate failures into plain language — matching
 * how the kit's headless packages behave at their boundaries. Non-2xx responses
 * become `http_error`; a thrown `fetch` (offline, DNS) becomes `network_error`.
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
 * Turn a settled `fetch` `Response` into a {@link Result}.
 *
 * The 2xx path performs the one unavoidable boundary cast: network JSON is
 * inherently untyped, so we trust the caller's `T` for the parsed body — every
 * other layer stays fully typed downstream of this single seam.
 */
async function toResult<T>(response: Response): Promise<Result<T>> {
  if (!response.ok) {
    return fail('http_error', await readErrorMessage(response));
  }
  // Single boundary cast: the network gives us `unknown` JSON; callers own `T`.
  return ok((await response.json()) as T);
}

/**
 * GET a URL and parse its JSON body as `T`.
 *
 * @typeParam T - the expected JSON shape on success.
 */
export async function getJson<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return toResult<T>(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Network request failed.';
    return fail('network_error', message);
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
    return toResult<T>(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Network request failed.';
    return fail('network_error', message);
  }
}
