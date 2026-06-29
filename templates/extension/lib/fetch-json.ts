import { type Result, fail, ok } from '@vybekiit/core';

const APP_URL = import.meta.env.WXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface ErrorBody {
  readonly error?: string;
  readonly message?: string;
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${APP_URL}${url}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: ErrorBody = await response.json();
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

export async function getJson<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(toAbsoluteUrl(url), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return toResult<T>(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Network request failed.';
    return fail('network_error', message);
  }
}
