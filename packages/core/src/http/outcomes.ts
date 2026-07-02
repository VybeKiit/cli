/** Stable semantic codes mirrored to HTTP status — agents branch on `code`, vibe coders see `error`. */
export const HTTP_OUTCOMES = {
  bad_input: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation_error: 422,
  too_many_requests: 429,
  server_error: 500,
  upstream_failed: 502,
  service_unavailable: 503,
} as const;

export type HttpOutcomeCode = keyof typeof HTTP_OUTCOMES;

export type HttpErrorStatus = (typeof HTTP_OUTCOMES)[HttpOutcomeCode];
