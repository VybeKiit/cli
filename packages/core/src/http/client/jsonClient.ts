import { HTTP_OUTCOMES, type HttpOutcomeCode } from '@vybekiit/core/http/outcomes';
import { fail, ok, type Result } from '@vybekiit/core/result';

/** Shape we opportunistically read an error message from on a non-2xx body. */
type ErrorBody = {
  readonly code?: string;
  readonly error?: string;
  readonly message?: string;
};

/** Options for the shared JSON client factory. */
export type JsonClientOptions = {
  /** Resolve relative API paths for non-web clients; omitted keeps the URL unchanged. */
  readonly resolveUrl?: (url: string) => string;
  /** Fetch implementation to use; tests inject this, runtime code uses global fetch. */
  readonly fetch?: typeof fetch;
};

const OUTCOME_CODES = new Set<string>(Object.keys(HTTP_OUTCOMES));

/**
 * Check whether a string is one of the shared HTTP outcome codes.
 *
 * @param code - Candidate response code from a server body.
 * @returns Whether the candidate is a known HTTP outcome code.
 * @example
 * isHttpOutcomeCode('validation_error') === true;
 */
const isHttpOutcomeCode = (code: string): code is HttpOutcomeCode => OUTCOME_CODES.has(code);

/**
 * Resolve the semantic outcome code for an HTTP status.
 *
 * @param status - Numeric HTTP status from a Response.
 * @returns The matching outcome code, or `server_error` when no mapping exists.
 * @example
 * const code = outcomeCodeFromStatus(401);
 */
const outcomeCodeFromStatus = (status: number): HttpOutcomeCode => {
  for (const [code, mappedStatus] of Object.entries(HTTP_OUTCOMES)) {
    if (mappedStatus === status) {
      return code as HttpOutcomeCode;
    }
  }
  return 'server_error';
};

/**
 * Resolve the best error message from a structured error body.
 *
 * @param body - Error body parsed from a non-2xx JSON response.
 * @param status - HTTP status used for the fallback message.
 * @returns The message to expose in the failed Result.
 * @example
 * const message = errorMessageFromBody({ error: 'Invalid' }, 422);
 */
const errorMessageFromBody = (body: ErrorBody, status: number): string => {
  if (body.error !== undefined) {
    return body.error;
  }
  if (body.message !== undefined) {
    return body.message;
  }
  return `Request failed (${status}).`;
};

/**
 * Convert a non-2xx JSON response into a failed Result.
 *
 * @param response - Fetch Response returned by the server.
 * @returns A failed Result with the semantic code and message.
 * @example
 * const result = await readErrorResult(response);
 */
const readErrorResult = async (response: Response): Promise<Result<never>> => {
  try {
    const body = (await response.json()) as ErrorBody;
    const message = errorMessageFromBody(body, response.status);
    const code =
      body.code && isHttpOutcomeCode(body.code)
        ? body.code
        : outcomeCodeFromStatus(response.status);
    return fail(code, message);
  } catch {
    return fail(outcomeCodeFromStatus(response.status), `Request failed (${response.status}).`);
  }
};

/**
 * Convert a fetch Response into a Result.
 *
 * @param response - Fetch Response returned by the server.
 * @returns A successful Result for 2xx JSON or a failed Result for non-2xx responses.
 * @example
 * const result = await toResult<{ id: string }>(response);
 */
const toResult = async <T>(response: Response): Promise<Result<T>> => {
  if (!response.ok) {
    return readErrorResult(response);
  }
  return ok((await response.json()) as T);
};

/**
 * Create a JSON client with optional URL resolution at the seam.
 *
 * @param options - Fetch and URL-resolution options for the runtime.
 * @returns A client with `getJson` and `postJson` helpers that return Results.
 * @example
 * const client = createJsonClient({ resolveUrl: (path) => `https://app.test${path}` });
 */
export const createJsonClient = (options: JsonClientOptions = {}) => {
  const resolveUrl =
    options.resolveUrl === undefined ? (url: string): string => url : options.resolveUrl;
  const resolveFetch = (): typeof fetch => {
    if (options.fetch !== undefined) {
      return options.fetch;
    }
    return fetch;
  };

  /**
   * Fetch JSON with GET and normalize expected failures.
   *
   * @param url - URL or path to fetch.
   * @returns A Result containing decoded JSON or a network/HTTP failure.
   * @example
   * const result = await client.getJson<{ id: string }>('/api/me');
   */
  const getJson = async <T>(url: string): Promise<Result<T>> => {
    try {
      const response = await resolveFetch()(resolveUrl(url), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      return toResult<T>(response);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Network request failed.';
      return fail('network_error', message);
    }
  };

  /**
   * Fetch JSON with POST and normalize expected failures.
   *
   * @param url - URL or path to fetch.
   * @param body - JSON-serializable request payload.
   * @returns A Result containing decoded JSON or a network/HTTP failure.
   * @example
   * const result = await client.postJson<{ id: string }>('/api/orders', payload);
   */
  const postJson = async <T>(url: string, body: unknown): Promise<Result<T>> => {
    try {
      const response = await resolveFetch()(resolveUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      return toResult<T>(response);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Network request failed.';
      return fail('network_error', message);
    }
  };

  return { getJson, postJson };
};

/** Same-origin web client; relative `/api/...` paths need no resolver. */
export const webJsonClient = createJsonClient();

/** Same-origin JSON helpers from {@link webJsonClient}. */
export const { getJson, postJson } = webJsonClient;
