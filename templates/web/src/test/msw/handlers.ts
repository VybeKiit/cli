import type { AuthUser } from '@vybekiit/auth';
import { http, HttpResponse } from 'msw';

export const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };

/** Default MSW handlers for buyer-facing wire points (auth + checkout). */
export const wirePointHandlers = [
  http.post('/api/auth/signin', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/signup', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/send-code', async () => HttpResponse.json({ ok: true })),
  http.post('/api/auth/verify', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/signout', async () => HttpResponse.json({ ok: true })),
  http.post('/api/checkout', async () => HttpResponse.json({ url: 'https://pay.example/c/1' })),
];

/** Handler that simulates an auth route failure. */
export function signInFailureHandler(message = 'Wrong password.') {
  return http.post('/api/auth/signin', async () =>
    HttpResponse.json({ code: 'unauthorized', error: message }, { status: 401 }),
  );
}
