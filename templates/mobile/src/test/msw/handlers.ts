import type { AuthUser } from '@vybekiit/auth';
import { DEFAULT_APP_URL } from '@vybekiit/core';
import { http, HttpResponse } from 'msw';

export const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };

const base = DEFAULT_APP_URL;

/** MSW handlers for mobile absolute API URLs. */
export const wirePointHandlers = [
  http.post(`${base}/api/auth/signin`, async () => HttpResponse.json(DEV_USER)),
  http.post(`${base}/api/auth/signup`, async () => HttpResponse.json(DEV_USER)),
  http.post(`${base}/api/auth/send-code`, async () => HttpResponse.json({ ok: true })),
  http.post(`${base}/api/auth/verify`, async () => HttpResponse.json(DEV_USER)),
  http.post(`${base}/api/auth/signout`, async () => HttpResponse.json({ ok: true })),
  http.post(`${base}/api/checkout`, async () =>
    HttpResponse.json({ url: `${base}/checkout/practice?productId=plan_pro` }),
  ),
];

/**
 * Override the sign-in route with a controlled failure.
 *
 * @param message - Error message returned by the mocked route.
 * @returns MSW handler for the sign-in failure path.
 * @example
 * mswServer.use(signInFailureHandler('Wrong password.'));
 */
export const signInFailureHandler = (message = 'Wrong password.') =>
  http.post(`${base}/api/auth/signin`, async () =>
    HttpResponse.json({ code: 'unauthorized', error: message }, { status: 401 }),
  );
