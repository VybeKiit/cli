import type { AuthUser } from '@vybekiit/auth';
import { http, HttpResponse } from 'msw';

/** Default signed-in user returned by local MSW auth handlers. */
const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };

/** Default MSW handlers for buyer-facing wire points (auth + checkout). */
const wirePointHandlers = [
  http.post('/api/auth/signin', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/signup', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/send-code', async () => HttpResponse.json({ ok: true })),
  http.post('/api/auth/verify', async () => HttpResponse.json(DEV_USER)),
  http.post('/api/auth/signout', async () => HttpResponse.json({ ok: true })),
  http.post('/api/checkout', async () => HttpResponse.json({ url: 'https://pay.example/c/1' })),
];

/**
 * Build a handler that simulates an auth route failure.
 *
 * @param message - Error message returned by the fake auth route.
 * @returns An MSW handler for failed sign-in requests.
 * @example
 * server.use(signInFailureHandler('Wrong password.'));
 */
const signInFailureHandler = (message = 'Wrong password.') =>
  http.post('/api/auth/signin', async () =>
    HttpResponse.json({ code: 'unauthorized', error: message }, { status: 401 }),
  );

export { DEV_USER, signInFailureHandler, wirePointHandlers };
