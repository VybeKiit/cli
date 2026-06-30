import { type Result, fail, ok } from '@vybekiit/core';

/** Shape we opportunistically read an error message from on a non-2xx body. */
interface ErrorBody {
  readonly error?: string;
  readonly message?: string;
}

export interface JsonClientOptions {
  /** Resolve relative API paths (mobile/spa); pass-through by default (web same-origin). */
  readonly resolveUrl?: (url: string) => string;
  readonly fetch?: typeof fetch;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error ?? body.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

async function toResult<T>(response: Response): Promise<Result<T>> {
  if (!response.ok) {
    return fail('http_error', await readErrorMessage(response));
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
