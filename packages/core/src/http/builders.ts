import { HTTP_OUTCOMES, type HttpOutcomeCode } from './outcomes';
import type { HttpErrorBody, HttpResponse } from './response';

function errorBody(code: HttpOutcomeCode, error: string): HttpErrorBody {
  return { code, error };
}

function errorResponse(
  code: HttpOutcomeCode,
  error: string,
): Extract<HttpResponse, { status: (typeof HTTP_OUTCOMES)[typeof code] }> {
  const status = HTTP_OUTCOMES[code];
  return { status, body: errorBody(code, error) } as Extract<
    HttpResponse,
    { status: (typeof HTTP_OUTCOMES)[typeof code] }
  >;
}

export function ok<T>(body: T): HttpResponse<T> {
  return { status: 200, body };
}

export function created<T>(body: T): HttpResponse<T> {
  return { status: 201, body };
}

export function badInput(error: string): HttpResponse<never> {
  return errorResponse('bad_input', error);
}

export function unauthorized(error: string): HttpResponse<never> {
  return errorResponse('unauthorized', error);
}

export function forbidden(error: string): HttpResponse<never> {
  return errorResponse('forbidden', error);
}

export function notFound(error: string): HttpResponse<never> {
  return errorResponse('not_found', error);
}

export function conflict(error: string): HttpResponse<never> {
  return errorResponse('conflict', error);
}

export function validationError(error: string): HttpResponse<never> {
  return errorResponse('validation_error', error);
}

export function tooManyRequests(error: string): HttpResponse<never> {
  return errorResponse('too_many_requests', error);
}

export function serverError(error: string): HttpResponse<never> {
  return errorResponse('server_error', error);
}

export function upstreamFailed(error: string): HttpResponse<never> {
  return errorResponse('upstream_failed', error);
}

export function serviceUnavailable(error: string): HttpResponse<never> {
  return errorResponse('service_unavailable', error);
}
