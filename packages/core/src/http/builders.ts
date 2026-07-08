import { HTTP_OUTCOMES, type HttpOutcomeCode } from './outcomes';
import type { HttpErrorBody, HttpResponse } from './response';

/**
 * Build a standard HTTP error response body.
 *
 * @param code - Semantic outcome code mirrored to status.
 * @param error - Plain error message returned to the caller.
 * @returns The JSON body for an error response.
 * @example
 * const body = errorBody('bad_input', 'Missing email.');
 */
const errorBody = (code: HttpOutcomeCode, error: string): HttpErrorBody => ({ code, error });

/**
 * Build an error {@link HttpResponse} for an outcome code.
 *
 * @param code - Semantic outcome code.
 * @param error - Plain error message returned to the caller.
 * @returns The matching typed HTTP error response.
 * @example
 * const response = errorResponse('unauthorized', 'Sign in first.');
 */
const errorResponse = (
  code: HttpOutcomeCode,
  error: string,
): Extract<HttpResponse, { status: (typeof HTTP_OUTCOMES)[typeof code] }> => {
  const status = HTTP_OUTCOMES[code];
  return { status, body: errorBody(code, error) } as Extract<
    HttpResponse,
    { status: (typeof HTTP_OUTCOMES)[typeof code] }
  >;
};

/**
 * Build a 200 JSON response.
 *
 * @param body - Success payload to return.
 * @returns A typed 200 response.
 * @example
 * const response = ok({ id: 'order_1' });
 */
export const ok = <T>(body: T): HttpResponse<T> => ({ status: 200, body });

/**
 * Build a 201 JSON response.
 *
 * @param body - Created resource payload to return.
 * @returns A typed 201 response.
 * @example
 * const response = created({ id: 'order_1' });
 */
export const created = <T>(body: T): HttpResponse<T> => ({ status: 201, body });

/**
 * Build a 400 bad-input response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 400 response.
 * @example
 * const response = badInput('Invalid request body.');
 */
export const badInput = (error: string): HttpResponse<never> => errorResponse('bad_input', error);

/**
 * Build a 401 unauthorized response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 401 response.
 * @example
 * const response = unauthorized('Sign in first.');
 */
export const unauthorized = (error: string): HttpResponse<never> =>
  errorResponse('unauthorized', error);

/**
 * Build a 403 forbidden response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 403 response.
 * @example
 * const response = forbidden('Request blocked.');
 */
export const forbidden = (error: string): HttpResponse<never> => errorResponse('forbidden', error);

/**
 * Build a 404 not-found response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 404 response.
 * @example
 * const response = notFound('Order not found.');
 */
export const notFound = (error: string): HttpResponse<never> => errorResponse('not_found', error);

/**
 * Build a 409 conflict response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 409 response.
 * @example
 * const response = conflict('Email already exists.');
 */
export const conflict = (error: string): HttpResponse<never> => errorResponse('conflict', error);

/**
 * Build a 422 validation-error response.
 *
 * @param error - Plain validation message returned to the caller.
 * @returns A typed 422 response.
 * @example
 * const response = validationError('Email is required.');
 */
export const validationError = (error: string): HttpResponse<never> =>
  errorResponse('validation_error', error);

/**
 * Build a 429 rate-limit response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 429 response.
 * @example
 * const response = tooManyRequests('Please wait a moment.');
 */
export const tooManyRequests = (error: string): HttpResponse<never> =>
  errorResponse('too_many_requests', error);

/**
 * Build a 500 server-error response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 500 response.
 * @example
 * const response = serverError('Something went wrong.');
 */
export const serverError = (error: string): HttpResponse<never> =>
  errorResponse('server_error', error);

/**
 * Build a 502 upstream-failed response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 502 response.
 * @example
 * const response = upstreamFailed('Payment provider failed.');
 */
export const upstreamFailed = (error: string): HttpResponse<never> =>
  errorResponse('upstream_failed', error);

/**
 * Build a 503 service-unavailable response.
 *
 * @param error - Plain error message returned to the caller.
 * @returns A typed 503 response.
 * @example
 * const response = serviceUnavailable('Try again later.');
 */
export const serviceUnavailable = (error: string): HttpResponse<never> =>
  errorResponse('service_unavailable', error);
