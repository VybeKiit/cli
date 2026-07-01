import type { HttpOutcomeCode } from './outcomes';

export type HttpErrorBody = { readonly code: HttpOutcomeCode; readonly error: string };

export type HttpResponse<TSuccess = unknown> =
  | { readonly status: 200; readonly body: TSuccess }
  | { readonly status: 201; readonly body: TSuccess }
  | { readonly status: 400; readonly body: HttpErrorBody }
  | { readonly status: 401; readonly body: HttpErrorBody }
  | { readonly status: 403; readonly body: HttpErrorBody }
  | { readonly status: 404; readonly body: HttpErrorBody }
  | { readonly status: 409; readonly body: HttpErrorBody }
  | { readonly status: 422; readonly body: HttpErrorBody }
  | { readonly status: 429; readonly body: HttpErrorBody }
  | { readonly status: 500; readonly body: HttpErrorBody }
  | { readonly status: 502; readonly body: HttpErrorBody }
  | { readonly status: 503; readonly body: HttpErrorBody };
