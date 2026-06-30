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

export function signInFailureHandler(message = 'Wrong password.') {
  return http.post(`${base}/api/auth/signin`, async () =>
    HttpResponse.json({ error: message }, { status: 401 }),
  );
}
