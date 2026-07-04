import { HTTP_OUTCOMES, type HttpOutcomeCode } from '@vybekiit/core/http/outcomes';
import { fail, ok, type Result } from '@vybekiit/core/result';

/** Shape we opportunistically read an error message from on a non-2xx body. */
interface ErrorBody {
  readonly code?: string;
  readonly error?: string;
  readonly message?: string;
}

export interface JsonClientOptions {
  /** Resolve relative API paths (mobile/spa); pass-through by default (web same-origin). */
  readonly resolveUrl?: (url: string) => string;
  readonly fetch?: typeof fetch;
}

const OUTCOME_CODES = new Set<string>(Object.keys(HTTP_OUTCOMES));

function isHttpOutcomeCode(code: string): code is HttpOutcomeCode {
  return OUTCOME_CODES.has(code);
}

function outcomeCodeFromStatus(status: number): HttpOutcomeCode {
  for (const [code, mappedStatus] of Object.entries(HTTP_OUTCOMES)) {
    if (mappedStatus === status) return code as HttpOutcomeCode;
  }
  return 'server_error';
}

async function readErrorResult(response: Response): Promise<Result<never>> {
  try {
    const body = (await response.json()) as ErrorBody;
    const message = body.error ?? body.message ?? `Request failed (${response.status}).`;
    const code =
      body.code && isHttpOutcomeCode(body.code)
        ? body.code
        : outcomeCodeFromStatus(response.status);
    return fail(code, message);
  } catch {
    return fail(outcomeCodeFromStatus(response.status), `Request failed (${response.status}).`);
  }
}

async function toResult<T>(response: Response): Promise<Result<T>> {
  if (!response.ok) {
    return readErrorResult(response);
  }
  return ok((await response.json()) as T);
}

/**
 * Create a JSON client with optional URL resolution at the seam.
 * Web uses default pass-through; mobile/spa pass an origin resolver.
 */
export function createJsonClient(options: JsonClientOptions = {}) {
  const resolveUrl = options.resolveUrl ?? ((url: string) => url);
  const resolveFetch = () => options.fetch ?? fetch;

  async function getJson<T>(url: string): Promise<Result<T>> {
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
  }

  async function postJson<T>(url: string, body: unknown): Promise<Result<T>> {
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
  }

  return { getJson, postJson };
}

/** Same-origin web client — relative `/api/...` paths need no resolver. */
export const webJsonClient = createJsonClient();

export const getJson = webJsonClient.getJson;
export const postJson = webJsonClient.postJson;
